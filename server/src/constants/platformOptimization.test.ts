import { describe, expect, it } from "vitest";

import {
  AI_OPTIMIZATION_TARGETS,
  buildFullPostSystemPrompt,
  buildFullPostUserPrompt,
  isValidOptimizationTargets,
  resolveOptimizationTargets,
} from "./platformOptimization";

describe("platformOptimization", () => {
  it("resolveOptimizationTargets defaults when empty", () => {
    expect(resolveOptimizationTargets()).toEqual([AI_OPTIMIZATION_TARGETS.DEVTO]);
    expect(resolveOptimizationTargets([])).toEqual([AI_OPTIMIZATION_TARGETS.DEVTO]);
  });

  it("resolveOptimizationTargets normalizes valid slugs", () => {
    expect(resolveOptimizationTargets([" LinkedIn ", "google"])).toEqual([
      AI_OPTIMIZATION_TARGETS.LINKEDIN,
      AI_OPTIMIZATION_TARGETS.GOOGLE,
    ]);
  });

  it("isValidOptimizationTargets rejects empty or unknown", () => {
    expect(isValidOptimizationTargets([])).toBe(false);
    expect(isValidOptimizationTargets(["devto", "nope"])).toBe(false);
    expect(isValidOptimizationTargets(["devto", "linkedin"])).toBe(true);
  });

  it("buildFullPostSystemPrompt blends DEV.to + LinkedIn and monetization research", () => {
    const prompt = buildFullPostSystemPrompt(["devto", "linkedin"], {
      monetizationAngle: "affiliate widgets",
      intentLabel: "commercial",
    });
    expect(prompt).toContain("Blended DEV.to + LinkedIn");
    expect(prompt).toContain("affiliate widgets");
    expect(prompt).toContain("commercial");
  });

  it("buildFullPostUserPrompt covers LinkedIn URL branches and Google SERP rules", () => {
    const withUrl = buildFullPostUserPrompt("nextjs streaming", ["linkedin"], {
      readMoreUrl: "https://blog.example.com/post",
      researchContext: { monetizationAngle: "saas trial", intentLabel: "informational" },
    });
    expect(withUrl).toContain("https://blog.example.com/post");
    expect(withUrl).toContain("saas trial");

    const withoutUrl = buildFullPostUserPrompt("nextjs streaming", ["linkedin"]);
    expect(withoutUrl).toContain("without any URL");

    const googlePrompt = buildFullPostUserPrompt("seo checklist", ["google"]);
    expect(googlePrompt).toContain("SERP-ready");
  });
});
