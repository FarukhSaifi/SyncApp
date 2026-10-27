import { describe, expect, it } from "vitest";

import { SEO_PUBLISH_WARNINGS, SEO_THRESHOLDS } from "@constants/seo";

import {
  getDevtoPublishWarnings,
  getPublishSeoWarnings,
  getSeoScorecard,
} from "./seoScorecard";

describe("getSeoScorecard", () => {
  it("returns low score for empty post with failing checks", () => {
    const card = getSeoScorecard({});
    expect(card.score).toBeLessThan(SEO_THRESHOLDS.PUBLISH_WARNING_SCORE_MIN);
    expect(card.maxScore).toBe(SEO_THRESHOLDS.SCORE_MAX);
    expect(card.checks.length).toBeGreaterThan(0);
  });

  it("scores a strong draft with metadata and content", () => {
    const title = "A".repeat(SEO_THRESHOLDS.TITLE_MIN + 5);
    const meta = "M".repeat(SEO_THRESHOLDS.META_DESC_MIN + 10);
    const card = getSeoScorecard(
      {
        title,
        meta_description: meta,
        slug: "syncapp-seo-test",
        cover_image: "https://cdn.example.com/cover.jpg",
        tags: ["javascript", "seo", "react", "webdev"],
        content_markdown: `# Intro\n\n## Section\n\nAnswer: SyncApp helps publish everywhere.\n\n![diagram](https://cdn.example.com/d.png "Architecture diagram")\n\n[Read more](/blog/other-post)\n`,
      },
      { platforms: ["devto", "google"], primaryKeyword: "syncapp" },
    );
    expect(card.score).toBeGreaterThan(0);
    expect(card.score).toBeLessThanOrEqual(SEO_THRESHOLDS.SCORE_MAX);
    expect(card.categories?.length ?? 0).toBeGreaterThan(0);
    expect(card.checks.some((c) => c.ok === true)).toBe(true);
  });
});

describe("getPublishSeoWarnings", () => {
  it("warns on missing meta, cover, and low score", () => {
    const warnings = getPublishSeoWarnings(
      { title: "Hi", content_markdown: "Short", tags: [] },
      { platforms: ["devto"] },
    );
    expect(warnings).toContain(SEO_PUBLISH_WARNINGS.NO_META);
    expect(warnings).toContain(SEO_PUBLISH_WARNINGS.NO_COVER);
    expect(warnings.some((w) => w.startsWith("SEO score is"))).toBe(true);
  });

  it("getDevtoPublishWarnings delegates with devto platform context", () => {
    const warnings = getDevtoPublishWarnings({ title: "T", content_markdown: "", tags: ["one"] });
    expect(warnings).toContain(SEO_PUBLISH_WARNINGS.NO_META);
    expect(warnings).toContain(SEO_PUBLISH_WARNINGS.FEW_TAGS);
  });
});
