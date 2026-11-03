import { describe, expect, it } from "vitest";

import { SEO_IMPROVE_APPLY, SEO_IMPROVE_FIELDS, SEO_IMPROVE_LIMITS } from "@constants/seo";

import { applySeoImproveFixes, buildSeoImproveTargets } from "./seoImproveTargets";

describe("buildSeoImproveTargets", () => {
  it("skips cover / featured image targets (manual)", () => {
    const targets = buildSeoImproveTargets({ title: "Hello world title here", content_markdown: "## Intro\n\nBody" }, [
      { label: "Cover / featured image missing", ok: false },
    ]);
    expect(targets).toHaveLength(0);
  });

  it("clamps currentValue to CURRENT_VALUE_MAX", () => {
    const longBody = `## Answer\n\n${"word ".repeat(SEO_IMPROVE_LIMITS.CURRENT_VALUE_MAX)}`;
    const targets = buildSeoImproveTargets({ title: "Title", content_markdown: longBody }, [
      { label: "Direct answer block missing", ok: false },
    ]);
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
    const result = applySeoImproveFixes(post, [
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
    expect(result.post.title).toBe("New Title");
    expect(result.post.content_markdown).toBe("alpha piece beta piece");
    expect(result.post.meta_description).toBe("Meta");
    expect(result.appliedIds).toEqual(["title", "content"]);
    expect(result.skippedIds).toEqual([]);
  });

  it("updates non-contiguous image alts by URL match", () => {
    const result = applySeoImproveFixes(
      {
        title: "T",
        meta_description: "M",
        tags: [],
        canonical_url: "",
        content_markdown: "Intro\n\n![](https://cdn.test/a.png)\n\nmid\n\n![](https://cdn.test/b.png)\n",
      },
      [
        {
          id: "content_image_alts",
          field: SEO_IMPROVE_FIELDS.CONTENT,
          issue: "Images missing alt text",
          currentValue: "![](https://cdn.test/a.png)\n![](https://cdn.test/b.png)",
          value: "![Cover A](https://cdn.test/a.png)\n![Cover B](https://cdn.test/b.png)",
          applyMode: SEO_IMPROVE_APPLY.REPLACE,
        },
      ],
    );
    expect(result.appliedIds).toEqual(["content_image_alts"]);
    expect(result.post.content_markdown).toContain("![Cover A](https://cdn.test/a.png)");
    expect(result.post.content_markdown).toContain("![Cover B](https://cdn.test/b.png)");
  });

  it("rewrites heading lines in document order without requiring contiguous pack", () => {
    const result = applySeoImproveFixes(
      {
        title: "T",
        meta_description: "M",
        tags: [],
        canonical_url: "",
        content_markdown: "# Intro\n\n## Section One\n\nBody\n\n## Section Two\n\nMore",
      },
      [
        {
          id: "content_headings",
          field: SEO_IMPROVE_FIELDS.CONTENT,
          issue: "Heading outline weak",
          currentValue: "## Section One\n## Section Two",
          value: "## Better One\n## Better Two\n## Extra Three",
          applyMode: SEO_IMPROVE_APPLY.REPLACE,
        },
      ],
    );
    expect(result.appliedIds).toEqual(["content_headings"]);
    expect(result.post.content_markdown).toContain("## Better One");
    expect(result.post.content_markdown).toContain("## Better Two");
    expect(result.post.content_markdown).toContain("## Extra Three");
    expect(result.post.content_markdown).toContain("Body");
  });

  it("skips unsafe large REPLACE that would truncate content", () => {
    const currentValue = "word ".repeat(SEO_IMPROVE_LIMITS.SAFE_REPLACE_MIN_CURRENT);
    const content = `${currentValue}TAIL_KEPT`;
    const result = applySeoImproveFixes(
      {
        title: "T",
        meta_description: "M",
        tags: [],
        canonical_url: "",
        content_markdown: content,
      },
      [
        {
          id: "content_anti_stuffing",
          field: SEO_IMPROVE_FIELDS.CONTENT,
          issue: "Keyword stuffing risk",
          currentValue,
          value: "tiny rewrite",
          applyMode: SEO_IMPROVE_APPLY.REPLACE,
        },
      ],
    );
    expect(result.appliedIds).toEqual([]);
    expect(result.skippedIds).toEqual(["content_anti_stuffing"]);
    expect(result.post.content_markdown).toBe(content);
  });
});
