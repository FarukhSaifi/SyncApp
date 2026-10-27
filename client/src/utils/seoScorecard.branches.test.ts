import { describe, expect, it } from "vitest";

import { SEO_THRESHOLDS } from "@constants/seo";

import { getPublishSeoWarnings, getSeoScorecard } from "./seoScorecard";

describe("seoScorecard branch coverage", () => {
  it("flags Google structure warnings when google platform selected", () => {
    const warnings = getPublishSeoWarnings(
      {
        title: "Short",
        content_markdown: "No headings here.",
        tags: ["one"],
      },
      { platforms: ["google", "devto"] },
    );
    expect(warnings.some((w) => w.includes("heading") || w.includes("Google"))).toBe(true);
  });

  it("treats public cover URL as satisfied for cover warning", () => {
    const title = "A".repeat(SEO_THRESHOLDS.TITLE_MIN + 2);
    const meta = "M".repeat(SEO_THRESHOLDS.META_DESC_MIN + 5);
    const card = getSeoScorecard(
      {
        title,
        meta_description: meta,
        slug: "slug",
        cover_image: "https://cdn.test/cover.png",
        content_markdown: "## Answer\n\nSyncApp publishes everywhere.\n\n## Next\n\nDetails.",
        tags: ["javascript", "react", "seo", "webdev"],
      },
      { platforms: ["devto"], primaryKeyword: "syncapp" },
    );
    expect(card.score).toBeGreaterThan(SEO_THRESHOLDS.PUBLISH_WARNING_SCORE_MIN / 2);
    const warnings = getPublishSeoWarnings(
      {
        title,
        meta_description: meta,
        cover_image: "https://cdn.test/cover.png",
        content_markdown: "## Answer\n\nSyncApp publishes everywhere.\n\nWhat do you think?\n",
        tags: ["javascript", "react", "seo", "webdev"],
      },
      { platforms: ["devto"] },
    );
    expect(warnings.some((w) => w.includes("cover"))).toBe(false);
  });
});
