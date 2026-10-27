/**
 * Targeted SEO improve — rewrite only failing/warning scorecard snippets.
 * Never regenerates the full post body.
 */
import {
  AI_CONFIG,
  AI_PROMPTS,
  AI_SEO_IMPROVE_RESPONSE_SCHEMA,
  SEO_IMPROVE_APPLY,
  SEO_IMPROVE_FIELDS,
  SEO_IMPROVE_LIMITS,
} from "@constants";
import { AppError } from "@middleware/errorHandler";
import type { ImproveSeoResult, SeoImproveFix, SeoImproveTargetInput } from "@types";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

import { buildModelCandidates, generateAiContent, getModelName, getText } from "./client";
import { isFallbackWorthyError, normalizeAiError } from "./errors";
import { withRetry } from "./retries";

const ALLOWED_FIELDS = new Set<string>(Object.values(SEO_IMPROVE_FIELDS));
const ALLOWED_APPLY = new Set<string>(Object.values(SEO_IMPROVE_APPLY));

function clamp(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return trimmed.slice(0, max).trim();
}

function sanitizeTargets(raw: unknown): SeoImproveTargetInput[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new AppError(ERROR_MESSAGES.AI_SEO_IMPROVE_TARGETS_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  const seen = new Set<string>();
  const targets: SeoImproveTargetInput[] = [];

  for (const item of raw.slice(0, SEO_IMPROVE_LIMITS.MAX_TARGETS)) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const field = typeof row.field === "string" ? row.field.trim() : "";
    const issue = typeof row.issue === "string" ? clamp(row.issue, SEO_IMPROVE_LIMITS.ISSUE_MAX) : "";
    const applyMode = typeof row.applyMode === "string" ? row.applyMode.trim() : SEO_IMPROVE_APPLY.REPLACE;
    if (!id || seen.has(id) || !ALLOWED_FIELDS.has(field) || !ALLOWED_APPLY.has(applyMode) || !issue) {
      continue;
    }
    seen.add(id);
    const currentValue =
      typeof row.currentValue === "string" ? clamp(row.currentValue, SEO_IMPROVE_LIMITS.CURRENT_VALUE_MAX) : "";
    const surroundingContext =
      typeof row.surroundingContext === "string"
        ? clamp(row.surroundingContext, SEO_IMPROVE_LIMITS.SURROUNDING_CHARS)
        : undefined;
    targets.push({
      id,
      field: field as SeoImproveTargetInput["field"],
      issue,
      currentValue,
      applyMode: applyMode as SeoImproveTargetInput["applyMode"],
      ...(surroundingContext ? { surroundingContext } : {}),
    });
  }

  if (targets.length === 0) {
    throw new AppError(ERROR_MESSAGES.AI_SEO_IMPROVE_TARGETS_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }
  return targets;
}

function tryParseFixes(rawText: string): SeoImproveFix[] {
  const stripped = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  const attempts = [stripped];
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    attempts.push(jsonMatch[0]);
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate) as { fixes?: unknown };
      if (!parsed || !Array.isArray(parsed.fixes)) {
        continue;
      }
      const fixes: SeoImproveFix[] = [];
      for (const item of parsed.fixes) {
        if (!item || typeof item !== "object") {
          continue;
        }
        const row = item as Record<string, unknown>;
        const id = typeof row.id === "string" ? row.id.trim() : "";
        const value = typeof row.value === "string" ? row.value.trim() : "";
        if (!id || !value) {
          continue;
        }
        const note = typeof row.note === "string" ? clamp(row.note, SEO_IMPROVE_LIMITS.ISSUE_MAX) : undefined;
        fixes.push({ id, value, ...(note ? { note } : {}) });
      }
      if (fixes.length > 0) {
        return fixes;
      }
    } catch {
      // try next
    }
  }
  throw new AppError(ERROR_MESSAGES.AI_SEO_IMPROVE_PARSE_FAILED, HTTP_STATUS.BAD_GATEWAY);
}

function alignFixesToTargets(targets: SeoImproveTargetInput[], fixes: SeoImproveFix[]): SeoImproveFix[] {
  const byId = new Map(fixes.map((f) => [f.id, f]));
  const aligned: SeoImproveFix[] = [];
  for (const target of targets) {
    const fix = byId.get(target.id);
    if (!fix || !fix.value.trim()) {
      continue;
    }
    aligned.push({
      id: target.id,
      value: fix.value.trim(),
      ...(fix.note ? { note: fix.note } : {}),
    });
  }
  if (aligned.length === 0) {
    throw new AppError(ERROR_MESSAGES.AI_SEO_IMPROVE_EMPTY, HTTP_STATUS.BAD_GATEWAY);
  }
  return aligned;
}

export async function improveSeoFromScorecard(options: {
  targets: unknown;
  model?: string;
  primaryKeyword?: string;
  title?: string;
  platforms?: string[];
}): Promise<ImproveSeoResult> {
  const targets = sanitizeTargets(options.targets);
  const primaryKeyword = clamp(options.primaryKeyword || "", SEO_IMPROVE_LIMITS.PRIMARY_KEYWORD_MAX);
  const title = clamp(options.title || "", SEO_IMPROVE_LIMITS.TITLE_CONTEXT_MAX);
  const platforms = Array.isArray(options.platforms)
    ? options.platforms
        .map((p) => String(p).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const payload = {
    primaryKeyword: primaryKeyword || undefined,
    title: title || undefined,
    platforms: platforms.length > 0 ? platforms : undefined,
    instruction: "Rewrite only each target's currentValue (or produce an append snippet). Do not return a full post.",
    targets: targets.map((t) => ({
      id: t.id,
      field: t.field,
      applyMode: t.applyMode,
      issue: t.issue,
      currentValue: t.currentValue,
      ...(t.surroundingContext ? { surroundingContext: t.surroundingContext } : {}),
    })),
  };

  const userMessage = AI_PROMPTS.SEO_IMPROVE_USER(JSON.stringify(payload, null, 2));
  const candidates = buildModelCandidates(getModelName(options.model));
  let lastError: unknown;

  for (const modelName of candidates) {
    try {
      const result = await withRetry(() =>
        generateAiContent({
          model: modelName,
          contents: userMessage,
          systemInstruction: AI_PROMPTS.SEO_IMPROVE_SYSTEM,
          maxOutputTokens: AI_CONFIG.MAX_SEO_IMPROVE_TOKENS,
          temperature: AI_CONFIG.TEMPERATURE_SEO_IMPROVE,
          responseMimeType: AI_CONFIG.RESPONSE_MIME_JSON,
          responseSchema: AI_SEO_IMPROVE_RESPONSE_SCHEMA,
        }),
      );
      const fixes = alignFixesToTargets(targets, tryParseFixes(getText(result)));
      return { fixes };
    } catch (err) {
      lastError = err;
      if (err instanceof AppError && err.statusCode === HTTP_STATUS.BAD_REQUEST) {
        throw err;
      }
      if (!isFallbackWorthyError(err)) {
        normalizeAiError(err as Error & { status?: number; details?: unknown }, ERROR_MESSAGES.AI_SEO_IMPROVE_FAILED);
      }
    }
  }

  normalizeAiError(
    (lastError as Error & { status?: number; details?: unknown }) || new Error(ERROR_MESSAGES.AI_SEO_IMPROVE_FAILED),
    ERROR_MESSAGES.AI_SEO_IMPROVE_FAILED,
  );
}
