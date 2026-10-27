import { describe, expect, it } from "vitest";

import { SEO_IMPROVE_APPLY, SEO_IMPROVE_FIELDS, SEO_IMPROVE_LIMITS } from "@constants/seo";

import { applySeoImproveFixes, buildSeoImproveTargets } from "./seoImproveTargets";

describe("buildSeoImproveTargets", () => {
  it("skips cover / featured image targets (manual)", () => {
    const targets = buildSeoImproveTargets(
      { title: "Hello world title here", content_markdown: "## Intro\n\nBody" },
      [{ label: "Cover / featured image missing", ok: false }],
    );
    expect(targets).toHaveLength(0);
  });

  it("clamps currentValue to CURRENT_VALUE_MAX", () => {
    const longBody = `## Answer\n\n${"word ".repeat(SEO_IMPROVE_LIMITS.CURRENT_VALUE_MAX)}`;
    const targets = buildSeoImproveTargets(
      { title: "Title", content_markdown: longBody },
      [{ label: "Direct answer block missing", ok: false }],
    );
    expect(targets.length).toBeGreaterThan(0);
    expect(targets[0].currentValue.length).toBeLessThanOrEqual(SEO_IMPROVE_LIMITS.CURRENT_VALUE_MAX);
  });
});

describe("applySeoImproveFixes", () => {
  it("applies only selected title and uses replaceAll for content", () => {
    const post = {
      title: "Old",
      meta_description: "Meta",
      tags: ["a"],
      canonical_url: "https://example.com/a",
      content_markdown: "alpha snippet beta snippet",
    };
    const next = applySeoImproveFixes(post, [
      {
        id: "title",
        field: SEO_IMPROVE_FIELDS.TITLE,
        issue: "Title",
        currentValue: "Old",
        value: "New Title",
        applyMode: SEO_IMPROVE_APPLY.REPLACE,
      },
      {
        id: "content",
        field: SEO_IMPROVE_FIELDS.CONTENT,
        issue: "Snippet",
        currentValue: "snippet",
        value: "piece",
        applyMode: SEO_IMPROVE_APPLY.REPLACE,
      },
    ]);
    expect(next.title).toBe("New Title");
    expect(next.content_markdown).toBe("alpha piece beta piece");
    expect(next.meta_description).toBe("Meta");
  });
});
