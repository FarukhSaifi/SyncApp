import { describe, expect, it } from "vitest";

import { SEO_IMPROVE_APPLY, SEO_IMPROVE_FIELDS, SEO_IMPROVE_LIMITS, SEO_IMPROVE_TARGET_IDS } from "@constants/seo";

import { applySeoImproveFixes, buildSeoImproveTargets } from "./seoImproveTargets";

const basePost = {
  title: "SyncApp multi-platform publishing guide",
  meta_description: "",
  tags: ["javascript"],
  canonical_url: "https://blog.test/syncapp",
  content_markdown: "# Intro\n\nParagraph.\n\n## Section\n\n![alt](https://cdn.test/a.png)\n",
};

describe("buildSeoImproveTargets branch coverage", () => {
  it.each([
    ["Title too short", SEO_IMPROVE_TARGET_IDS.TITLE, SEO_IMPROVE_FIELDS.TITLE],
    ["Meta description missing", SEO_IMPROVE_TARGET_IDS.META_DESCRIPTION, SEO_IMPROVE_FIELDS.META_DESCRIPTION],
    ["Few tags for DEV.to", SEO_IMPROVE_TARGET_IDS.TAGS, SEO_IMPROVE_FIELDS.TAGS],
    ["No canonical URL", SEO_IMPROVE_TARGET_IDS.CANONICAL_URL, SEO_IMPROVE_FIELDS.CANONICAL_URL],
    ["Direct answer block missing", SEO_IMPROVE_TARGET_IDS.DIRECT_ANSWER, SEO_IMPROVE_FIELDS.CONTENT],
    ["Heading outline weak", SEO_IMPROVE_TARGET_IDS.HEADINGS, SEO_IMPROVE_FIELDS.CONTENT],
    ["Query missing in intro", SEO_IMPROVE_TARGET_IDS.QUERY_INTRO, SEO_IMPROVE_FIELDS.CONTENT],
    ["Keyword stuffing risk", SEO_IMPROVE_TARGET_IDS.ANTI_STUFFING, SEO_IMPROVE_FIELDS.CONTENT],
    ["Images missing alt text", SEO_IMPROVE_TARGET_IDS.IMAGE_ALTS, SEO_IMPROVE_FIELDS.CONTENT],
    ["Add internal links", SEO_IMPROVE_TARGET_IDS.INTERNAL_LINKS, SEO_IMPROVE_FIELDS.CONTENT],
    ["Add authority links", SEO_IMPROVE_TARGET_IDS.AUTHORITY, SEO_IMPROVE_FIELDS.CONTENT],
    ["Add troubleshooting section", SEO_IMPROVE_TARGET_IDS.TROUBLESHOOTING, SEO_IMPROVE_FIELDS.CONTENT],
    ["Add discussion question", SEO_IMPROVE_TARGET_IDS.DISCUSSION, SEO_IMPROVE_FIELDS.CONTENT],
  ])("maps %s to target id %s", (label, expectedId, expectedField) => {
    const targets = buildSeoImproveTargets(basePost, [{ label, ok: false }]);
    expect(targets.some((t) => t.id === expectedId && t.field === expectedField)).toBe(true);
  });

  it("merges duplicate target issues for the same field", () => {
    const targets = buildSeoImproveTargets(basePost, [
      { label: "Title too short", ok: false },
      { label: "Title missing primary keyword", ok: false },
    ]);
    expect(targets).toHaveLength(1);
    expect(targets[0].issue).toContain(";");
  });

  it("caps targets at MAX_TARGETS when many distinct issues fail", () => {
    const checks = Object.entries(SEO_IMPROVE_TARGET_IDS)
      .filter(([key]) => key !== "DISCUSSION")
      .map(([, id]) => ({
        label:
          id === SEO_IMPROVE_TARGET_IDS.TITLE
            ? "Title too short"
            : id === SEO_IMPROVE_TARGET_IDS.META_DESCRIPTION
              ? "Meta description missing"
              : id === SEO_IMPROVE_TARGET_IDS.TAGS
                ? "Few tags for DEV.to"
                : id === SEO_IMPROVE_TARGET_IDS.CANONICAL_URL
                  ? "No canonical URL"
                  : id === SEO_IMPROVE_TARGET_IDS.DIRECT_ANSWER
                    ? "Direct answer block missing"
                    : id === SEO_IMPROVE_TARGET_IDS.HEADINGS
                      ? "Heading outline weak"
                      : id === SEO_IMPROVE_TARGET_IDS.QUERY_INTRO
                        ? "Query missing in intro"
                        : id === SEO_IMPROVE_TARGET_IDS.ANTI_STUFFING
                          ? "Keyword stuffing risk"
                          : id === SEO_IMPROVE_TARGET_IDS.IMAGE_ALTS
                            ? "Images missing alt text"
                            : id === SEO_IMPROVE_TARGET_IDS.INTERNAL_LINKS
                              ? "Add internal links"
                              : id === SEO_IMPROVE_TARGET_IDS.AUTHORITY
                                ? "Add authority links"
                                : "Add troubleshooting section",
        ok: false as const,
      }));
    const targets = buildSeoImproveTargets(basePost, checks);
    expect(targets.length).toBeLessThanOrEqual(SEO_IMPROVE_LIMITS.MAX_TARGETS);
  });

  it("ignores ok checks and manual schema/cover labels", () => {
    expect(buildSeoImproveTargets(basePost, [{ label: "Title ok", ok: true }])).toHaveLength(0);
    expect(
      buildSeoImproveTargets(basePost, [{ label: "Schema-ready metadata", ok: false }]),
    ).toHaveLength(0);
  });
});

describe("applySeoImproveFixes branches", () => {
  it("appends content when applyMode is APPEND", () => {
    const next = applySeoImproveFixes(
      {
        title: "T",
        meta_description: "M",
        tags: ["a"],
        canonical_url: "https://x.test/a",
        content_markdown: "Intro",
      },
      [
        {
          id: "disc",
          field: SEO_IMPROVE_FIELDS.CONTENT,
          issue: "Discussion",
          currentValue: "",
          value: "What do you think?",
          applyMode: SEO_IMPROVE_APPLY.APPEND,
        },
      ],
    );
    expect(next.content_markdown).toContain("What do you think?");
  });

  it("skips empty fix values and leaves post unchanged", () => {
    const post = {
      title: "T",
      meta_description: "M",
      tags: ["a"],
      canonical_url: "https://x.test/a",
      content_markdown: "Body",
    };
    const next = applySeoImproveFixes(post, [
      {
        id: "title",
        field: SEO_IMPROVE_FIELDS.TITLE,
        issue: "Title",
        currentValue: "T",
        value: "   ",
        applyMode: SEO_IMPROVE_APPLY.REPLACE,
      },
    ]);
    expect(next).toEqual(post);
  });

  it("updates tags from comma-separated value", () => {
    const next = applySeoImproveFixes(
      {
        title: "T",
        meta_description: "M",
        tags: [],
        canonical_url: "",
        content_markdown: "",
      },
      [
        {
          id: "tags",
          field: SEO_IMPROVE_FIELDS.TAGS,
          issue: "Tags",
          currentValue: "",
          value: "react, seo, #devto",
          applyMode: SEO_IMPROVE_APPLY.REPLACE,
        },
      ],
    );
    expect(next.tags).toEqual(["react", "seo", "devto"]);
  });
});
