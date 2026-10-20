/**
 * Shared AI JSON / phrase helpers used by trending topics and keyword research.
 */
import { AI_CONFIG } from "@constants";
import type { KeywordIntentLabel } from "@types";
import { sanitizeJsonString } from "@utils/sanitizeJson";

const INTENT_LABEL_SET = new Set<string>(AI_CONFIG.KEYWORD_INTENT_LABELS);

export function cleanPhrase(value: unknown, maxLen: number): string {
  return String(value)
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/^["']|["']$/g, "")
    .slice(0, maxLen);
}

export function clampKeywordScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return AI_CONFIG.KEYWORD_SCORE_MIN;
  }
  return Math.max(AI_CONFIG.KEYWORD_SCORE_MIN, Math.min(AI_CONFIG.KEYWORD_SCORE_MAX, Math.round(n)));
}

export function isKeywordIntentLabel(value: unknown): value is KeywordIntentLabel {
  return typeof value === "string" && INTENT_LABEL_SET.has(value.trim().toLowerCase());
}

export function parseIntentLabel(value: unknown): KeywordIntentLabel {
  if (isKeywordIntentLabel(value)) {
    return value.trim().toLowerCase() as KeywordIntentLabel;
  }
  return AI_CONFIG.KEYWORD_INTENT_DEFAULT;
}

/**
 * Opportunity when the model omits it: high commercial intent × low competition.
 */
export function deriveOpportunityScore(commercialIntent: number, competition: number): number {
  return clampKeywordScore(
    commercialIntent * (1 - competition / AI_CONFIG.KEYWORD_SCORE_MAX),
  );
}

/** Build JSON parse candidates (raw, sanitized, first object match). */
export function buildJsonParseAttempts(rawText: string): string[] {
  const stripped = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const attempts = [stripped, sanitizeJsonString(stripped)];
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    attempts.push(sanitizeJsonString(jsonMatch[0]));
  }
  return attempts;
}
