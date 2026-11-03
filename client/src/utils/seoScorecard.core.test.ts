import { describe, expect, it } from "vitest";

import { SEO_CHECK_LABELS, SEO_PUBLISH_WARNINGS, SEO_THRESHOLDS } from "@constants/seo";

import { getDevtoPublishWarnings, getPublishSeoWarnings, getSeoScorecard } from "./seoScorecard";

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

  it("flags stuffed repeated phrases in title and openers", () => {
    const phrase = "stream gemini responses";
    const title = `${phrase} ${phrase} guide for teams`;
    const meta = "M".repeat(SEO_THRESHOLDS.META_DESC_MIN + 5);
    const body = [
      `## ${phrase}`,
      "",
      `${phrase} helps when ${phrase} appears again in the opener.`,
      "",
      `## ${phrase} again`,
      "",
      `${phrase} still repeats here for stuffing detection.`,
    ].join("\n");
    const card = getSeoScorecard(
      { title, meta_description: meta, content_markdown: body, tags: ["ai"] },
      { platforms: ["google"], primaryKeyword: phrase },
    );
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.ANTI_STUFFING_FAIL)?.ok).toBe(false);
  });

  it("fails when markdown images lack descriptive alt text", () => {
    const title = "A".repeat(SEO_THRESHOLDS.TITLE_MIN + 2);
    const meta = "M".repeat(SEO_THRESHOLDS.META_DESC_MIN + 5);
    const card = getSeoScorecard(
      {
        title,
        meta_description: meta,
        content_markdown: "## One\n\n![image](https://cdn.example.com/a.png)\n\n## Two\n\nMore.",
        tags: ["seo"],
      },
      { platforms: ["google"] },
    );
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.IMAGE_ALT_FAIL)?.ok).toBe(false);
  });

  it("applies DEV discussion check only when DEV is a target platform", () => {
    const title = "A".repeat(SEO_THRESHOLDS.TITLE_MIN + 2);
    const meta = "M".repeat(SEO_THRESHOLDS.META_DESC_MIN + 5);
    const content = [
      "## Answer",
      "",
      "SyncApp publishes to many platforms with one editor workflow and clear SEO checks for teams.",
      "",
      "## Details",
      "",
      "More depth without a discussion question at the end.",
    ].join("\n");
    const base = {
      title,
      meta_description: meta,
      content_markdown: content,
      tags: ["javascript", "seo", "react", "webdev"],
    };
    const googleOnly = getSeoScorecard(base, { platforms: ["google"] });
    const withDev = getSeoScorecard(base, { platforms: ["devto", "google"] });
    expect(googleOnly.checks.some((c) => c.label === SEO_CHECK_LABELS.NO_DISCUSSION)).toBe(false);
    expect(
      withDev.checks.some(
        (c) => c.label === SEO_CHECK_LABELS.NO_DISCUSSION || c.label === SEO_CHECK_LABELS.HAS_DISCUSSION,
      ),
    ).toBe(true);
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
