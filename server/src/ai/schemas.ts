/**
 * Parse and normalize AI generate-post JSON (no Zod — plain JSON + sanitize).
 */
import { AI_POST_LIMITS } from "../constants";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";
import type { GeneratePostResult } from "../types";
import { sanitizeJsonString } from "../utils/sanitizeJson";

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag).trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, ""))
    .filter(Boolean)
    .slice(0, AI_POST_LIMITS.TAG_COUNT);
}

function softClampTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length <= AI_POST_LIMITS.TITLE_MAX) return trimmed;
  return trimmed.slice(0, AI_POST_LIMITS.TITLE_MAX).trim();
}

function softClampMeta(meta: string): string {
  const trimmed = meta.trim();
  if (trimmed.length <= AI_POST_LIMITS.META_DESC_MAX) return trimmed;
  return trimmed.slice(0, AI_POST_LIMITS.META_DESC_MAX).trim();
}

function tryParseObject(raw: string): Record<string, unknown> {
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const attempts = [stripped, sanitizeJsonString(stripped)];
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) attempts.push(sanitizeJsonString(jsonMatch[0]));

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // try next
    }
  }

  throw new Error("unparseable");
}

/** Parse model JSON into GeneratePostResult; fail hard if title/content missing. */
export function parseGeneratePostResponse(rawText: string): GeneratePostResult {
  try {
    const parsed = tryParseObject(rawText);
    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const contentRaw =
      (typeof parsed.content_markdown === "string" && parsed.content_markdown) ||
      (typeof parsed.content === "string" && parsed.content) ||
      "";
    const content = contentRaw.trim();
    if (!title || !content) {
      throw new AppError(ERROR_MESSAGES.AI_PARSE_FAILED, HTTP_STATUS.BAD_GATEWAY);
    }
    return {
      title: softClampTitle(title),
      meta_description: softClampMeta(typeof parsed.meta_description === "string" ? parsed.meta_description : ""),
      tags: normalizeTags(parsed.tags),
      content,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(ERROR_MESSAGES.AI_PARSE_FAILED, HTTP_STATUS.BAD_GATEWAY);
  }
}
