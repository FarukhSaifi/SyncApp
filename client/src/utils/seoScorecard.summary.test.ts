import type { SeoCheck } from "@types";
import { describe, expect, it } from "vitest";

import { formatSeoScoreSummary, parseSeoScoreSummary } from "./seoScorecard";

describe("formatSeoScoreSummary / parseSeoScoreSummary", () => {
  it("round-trips checklist summary lines", () => {
    const checks: SeoCheck[] = [
      { label: "Title length", ok: true },
      { label: "Meta description", ok: false },
    ];
    const summary = formatSeoScoreSummary(checks);
    const parsed = parseSeoScoreSummary(summary);
    expect(parsed.length).toBeGreaterThanOrEqual(2);
    expect(parsed.some((c) => c.label.includes("Title") && c.ok)).toBe(true);
    expect(parsed.some((c) => c.label.includes("Meta") && c.ok === false)).toBe(true);
  });
});
