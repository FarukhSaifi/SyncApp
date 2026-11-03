import { AI_CONFIG } from "@constants";
import { describe, expect, it } from "vitest";


import {
  buildJsonParseAttempts,
  clampKeywordScore,
  cleanPhrase,
  deriveOpportunityScore,
  isKeywordIntentLabel,
  parseIntentLabel,
} from "./parseHelpers";

describe("parseHelpers", () => {
  it("cleanPhrase trims hashes and quotes", () => {
    expect(cleanPhrase("  ## Topic  ", 20)).toBe("Topic");
    expect(cleanPhrase("'hello'", 10)).toBe("hello");
  });

  it("clampKeywordScore bounds numeric input", () => {
    expect(clampKeywordScore("not-a-number")).toBe(AI_CONFIG.KEYWORD_SCORE_MIN);
    expect(clampKeywordScore(999)).toBe(AI_CONFIG.KEYWORD_SCORE_MAX);
    expect(clampKeywordScore(50)).toBe(50);
  });

  it("detects and parses keyword intent labels", () => {
    expect(isKeywordIntentLabel("commercial")).toBe(true);
    expect(isKeywordIntentLabel("unknown")).toBe(false);
    expect(parseIntentLabel(" Informational ")).toBe("informational");
    expect(parseIntentLabel(null)).toBe(AI_CONFIG.KEYWORD_INTENT_DEFAULT);
  });

  it("deriveOpportunityScore combines intent and competition", () => {
    const score = deriveOpportunityScore(80, 20);
    expect(score).toBeGreaterThanOrEqual(AI_CONFIG.KEYWORD_SCORE_MIN);
    expect(score).toBeLessThanOrEqual(AI_CONFIG.KEYWORD_SCORE_MAX);
  });

  it("buildJsonParseAttempts strips fences and adds object slice", () => {
    const raw = '```json\n{"a":1}\n```';
    const attempts = buildJsonParseAttempts(raw);
    expect(attempts[0]).toBe('{"a":1}');
    expect(attempts.some((a) => a.includes('"a"'))).toBe(true);
  });
});
