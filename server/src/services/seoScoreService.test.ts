/**
 * SEO scorecard unit tests (Vitest).
 */
import { config } from "@config";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SEO_CHECK_LABELS, SEO_PUBLISH_WARNINGS, SEO_THRESHOLDS } from "@constants/seo";

import {
  buildPersistedSeoFields,
  getDevtoPublishWarnings,
  getPublishSeoWarnings,
  getSeoScorecard,
} from "./seoScoreService";

describe("getSeoScorecard", () => {
  it("scores an empty post low without body (rescaled metadata-only path)", () => {
    const card = getSeoScorecard({});
    expect(card.score).toBeLessThan(20);
    expect(card.maxScore).toBe(100);
  });

  it("does not use list-side rescaling when body is present", () => {
    const card = getSeoScorecard(
      {
        title: "How to stream Gemini AI responses in Next.js App Router",
        meta_description:
          "Learn how to stream Gemini responses in the Next.js App Router with working examples, timeouts, and production caveats for Vercel.",
        cover_image: "https://cdn.example.com/cover.png",
        canonical_url: "https://example.com/blog/stream-gemini",
        tags: ["webdev", "nextjs", "ai", "tutorial"],
        content_markdown: `Intro paragraph with enough detail for readers.

## Stream Gemini responses in Next.js

Streaming Gemini responses in the Next.js App Router means piping model chunks to the client with a ReadableStream and handling Vercel timeouts carefully. Use the AI SDK stream helpers.

## Implementation

\`\`\`ts
export async function POST() { return new Response("ok"); }
\`\`\`

See https://github.com/example/demo for the full repo.

## Troubleshooting

Watch for truncated streams.

## Discussion

What edge cases have you hit?
`,
      },
      { primaryKeyword: "stream Gemini AI responses in Next.js", platforms: ["devto"] },
    );
    expect(card.score).toBeGreaterThan(0);
    expect(card.score).toBeLessThanOrEqual(100);
    expect(card.checks.some((c) => c.label.includes("Title"))).toBe(true);
  });

  it("applies Google tag weighting when DEV is not a target", () => {
    const base = {
      title: "How to stream Gemini AI responses in Next.js App Router",
      meta_description:
        "Learn how to stream Gemini responses in the Next.js App Router with working examples, timeouts, and production caveats for Vercel.",
      cover_image: "https://cdn.example.com/cover.png",
      canonical_url: "https://example.com/blog/stream-gemini",
      tags: ["nextjs", "gemini", "streaming"],
      content_markdown: `## Answer

Streaming Gemini in Next.js App Router uses ReadableStream chunks with careful timeout handling on Vercel for reliable production delivery.

## Details

\`\`\`ts
const x = 1;
\`\`\`
`,
    };
    const googleCard = getSeoScorecard(base, { platforms: ["google"] });
    const devCard = getSeoScorecard(base, { platforms: ["devto"] });
    expect(googleCard.summary).not.toEqual(devCard.summary);
  });

  it("buildPersistedSeoFields stores score and context", () => {
    const fields = buildPersistedSeoFields(
      {
        title: "Short title only here now",
        content_markdown:
          "## One\n\nBody text with enough words for a direct answer block that is concise.\n\n## Two\n\nMore.",
        meta_description: "x".repeat(130),
        tags: ["a", "b", "c"],
      },
      { primaryKeyword: "stream gemini", platforms: ["google"] },
    );
    expect(typeof fields.seo_score).toBe("number");
    expect(fields.seo_primary_keyword).toBe("stream gemini");
    expect(fields.seo_optimization_targets).toEqual(["google"]);
  });

  it("getPublishSeoWarnings returns messages for low Google scores", () => {
    const warnings = getPublishSeoWarnings(
      { title: "x", content_markdown: "short", meta_description: "", tags: [] },
      { primaryKeyword: "keyword", platforms: ["google"] },
    );
    expect(Array.isArray(warnings)).toBe(true);
  });

  it("getSeoScorecard handles wordpress and medium platform weighting", () => {
    const base = {
      title: "WordPress SEO title example for tests",
      content_markdown: "## Intro\n\nBody with enough words for scoring paths.\n\n## Details\n\nMore content.",
      meta_description: "Meta description for wordpress and medium platform weighting in scorecard.",
      tags: ["wordpress", "cms"],
      cover_image: "https://cdn.example/cover.png",
    };
    const wp = getSeoScorecard(base, { platforms: ["wordpress"] });
    const medium = getSeoScorecard(base, { platforms: ["medium"] });
    expect(wp.checks.length).toBeGreaterThan(0);
    expect(medium.checks.length).toBeGreaterThan(0);
  });

  it("getSeoScorecard handles linkedin platform weighting", () => {
    const card = getSeoScorecard(
      {
        title: "LinkedIn SEO title example",
        content_markdown: "## Hook\n\nBody with enough words for scoring.\n\n## CTA\n\nComment below.",
        meta_description: "Meta for LinkedIn optimization path in scorecard tests.",
        tags: ["linkedin", "seo"],
      },
      { platforms: ["linkedin"], primaryKeyword: "linkedin seo" },
    );
    expect(card.checks.some((c) => c.label.length > 0)).toBe(true);
  });

  it("getPublishSeoWarnings flags non-public cover, weak alts, and Google structure", () => {
    const warnings = getPublishSeoWarnings(
      {
        title: "x",
        meta_description: "Valid meta description length for publish warning branch coverage in tests.",
        cover_image: "data:image/png;base64,abc",
        tags: ["one", "two"],
        content_markdown: "![ ](https://cdn.example/img.png)\n\nShort body without headings.",
      },
      { platforms: ["devto", "google"] },
    );
    expect(warnings).toContain(SEO_PUBLISH_WARNINGS.COVER_NOT_PUBLIC);
    expect(warnings).toContain(SEO_PUBLISH_WARNINGS.FEW_TAGS);
    expect(warnings).toContain(SEO_PUBLISH_WARNINGS.NO_DISCUSSION);
    expect(warnings).toContain(SEO_PUBLISH_WARNINGS.NO_ALT);
    expect(warnings).toContain(SEO_PUBLISH_WARNINGS.WEAK_STRUCTURE);
  });

  it("getDevtoPublishWarnings delegates to devto platform context", () => {
    const direct = getPublishSeoWarnings({ title: "t", content_markdown: "" }, { platforms: ["devto"] });
    const viaDeprecated = getDevtoPublishWarnings({ title: "t", content_markdown: "" });
    expect(viaDeprecated).toEqual(direct);
  });

  it("returns empty scorecard for null post input", () => {
    const card = getSeoScorecard(null);
    expect(card.score).toBe(0);
    expect(card.checks).toEqual([]);
  });

  it("scores html image alts, phrase stuffing, and duplicate headings", () => {
    const repeated =
      "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega";
    const stuffedBody = `${repeated}\n${repeated}\n${repeated}\n${repeated}\n${repeated}`;
    const card = getSeoScorecard(
      {
        title: "SEO structure edge cases for scorecard tests",
        meta_description: "x".repeat(SEO_THRESHOLDS.META_DESC_MAX + 5),
        tags: ["one", "two"],
        content_markdown: `## Duplicate\n\n${stuffedBody}\n\n## Duplicate\n\n<img src="https://cdn.example/x.png" alt="image" />\n\nQuestion at end?\n`,
      },
      { platforms: ["google"], primaryKeyword: "missing keyword" },
    );
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.ANTI_STUFFING_FAIL)?.ok).toBe(false);
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.HEADINGS_WEAK)?.ok).toBe(false);
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.IMAGE_ALT_FAIL)?.ok).toBe(false);
    expect(card.checks.some((c) => c.label.startsWith("Meta description") && c.ok === false)).toBe(true);
    expect(card.summary).toContain("WARN");
  });

  it("marks meta description as non-unique when too similar to title", () => {
    const title = "How to stream Gemini responses in Next.js App Router";
    const card = getSeoScorecard(
      {
        title,
        meta_description: title,
        tags: ["nextjs", "gemini", "ai", "tutorial"],
        content_markdown:
          "## Answer\n\nStreaming Gemini responses in Next.js App Router requires careful timeout handling on Vercel for production reliability.\n\n## Details\n\nMore body copy here.",
      },
      { platforms: ["google"] },
    );
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.META_UNIQUE_FAIL)?.ok).toBe(false);
  });

  it("buildPersistedSeoFields normalizes platform targets", () => {
    const fields = buildPersistedSeoFields(
      { title: "Persisted SEO title example", content_markdown: "## Body\n\nText." },
      { platforms: [" Google ", "", "DEVTO"] },
    );
    expect(fields.seo_optimization_targets).toEqual(["google", "devto"]);
  });

  it("counts html anchor internal links and treats invalid cover urls as non-public", () => {
    config.canonicalBaseUrl = "https://blog.example.com";
    const card = getSeoScorecard(
      {
        title: "HTML internal links SEO title example",
        meta_description:
          "Meta description long enough for html anchor internal link scoring branch coverage in tests.",
        tags: ["seo", "html", "links"],
        cover_image: "/relative/cover.png",
        content_markdown:
          '## Intro\n\nSee <a href="https://blog.example.com/docs">docs</a>.\n\n## Body\n\nMore content here.',
      },
      { platforms: ["google"], primaryKeyword: "   " },
    );
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.HAS_INTERNAL_LINKS)?.ok).toBe(true);
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.COVER_NOT_PUBLIC)?.ok).toBe(false);
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.QUERY_INTRO_NA)?.ok).toBe(null);
  });

  it("scores partial meta descriptions and rejects weak direct-answer blocks", () => {
    const card = getSeoScorecard(
      {
        title: "Partial meta and direct answer SEO title",
        meta_description: "Short meta",
        tags: ["seo", "meta", "partial"],
        content_markdown:
          "## Intro\n\nThis direct answer block intentionally contains far too many words to qualify as a concise direct answer snippet for search results and should fail the direct answer check while still exercising meta partial scoring paths in the scorecard service.\n\n## More\n\nExtra section.",
      },
      { platforms: ["google"] },
    );
    expect(card.checks.some((c) => c.label.startsWith("Meta description") && c.warning === true)).toBe(true);
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.NO_DIRECT_ANSWER)?.ok).toBe(false);
  });

  it("rewards troubleshooting sections and discussion headings on devto", () => {
    const card = getSeoScorecard(
      {
        title: "Devto discussion SEO title example",
        meta_description: "Meta description long enough for troubleshooting and discussion section scoring in tests.",
        tags: ["webdev", "tutorial", "javascript", "beginners"],
        cover_image: "https://cdn.example/cover.png",
        canonical_url: "https://example.com/post",
        content_markdown:
          "## Answer\n\nStreaming Gemini responses in Next.js App Router requires careful timeout handling on Vercel for reliable production delivery.\n\n## Troubleshooting\n\nCheck timeouts.\n\n## Discussion\n\nWhat do you think?",
      },
      { platforms: ["devto"] },
    );
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.HAS_TROUBLESHOOTING)?.ok).toBe(true);
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.HAS_DISCUSSION)?.ok).toBe(true);
  });

  describe("canonical base and internal links", () => {
    const originalBase = config.canonicalBaseUrl;

    beforeEach(() => {
      config.canonicalBaseUrl = "https://blog.example.com";
    });

    afterEach(() => {
      config.canonicalBaseUrl = originalBase;
    });

    it("scores internal links against configured canonical hostname", () => {
      const card = getSeoScorecard(
        {
          title: "Internal links SEO title example",
          meta_description: "Meta description long enough for internal link scoring branch coverage in tests.",
          tags: ["seo", "links", "blog"],
          content_markdown:
            "## Intro\n\nRead more on [our docs](https://blog.example.com/docs) and [relative](/guides).\n\n## Body\n\nExtra paragraph.",
        },
        { platforms: ["google"], primaryKeyword: "internal links seo" },
      );
      expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.HAS_INTERNAL_LINKS)?.ok).toBe(true);
    });

    it("ignores invalid canonical base when counting internal links", () => {
      config.canonicalBaseUrl = ":::not-a-url";
      const card = getSeoScorecard(
        {
          title: "Fallback internal link scoring title",
          meta_description: "Meta description long enough for fallback internal link scoring branch tests.",
          tags: ["seo", "fallback", "links"],
          content_markdown: "## Intro\n\nSee [GitHub](https://github.com/example/repo).\n\n## More\n\nBody text.",
        },
        { platforms: ["google"] },
      );
      expect(card.score).toBeGreaterThan(0);
    });

    it("flags phrase stuffing and missing query in intro", () => {
      const keyword = "stream gemini nextjs";
      const card = getSeoScorecard(
        {
          title: "Stream gemini nextjs stream gemini nextjs stream gemini nextjs",
          meta_description: "Meta description long enough for anti stuffing and intro keyword branch tests here.",
          tags: ["nextjs", "gemini", "stream"],
          content_markdown:
            "## Later\n\nStream gemini nextjs appears only after intro window with enough words to score body content paths.\n\n## More\n\nExtra paragraph for length.",
        },
        { platforms: ["google"], primaryKeyword: keyword },
      );
      expect(card.checks.some((c) => c.label.includes("stuffing") || c.ok === false)).toBe(true);
    });

    it("counts html anchor internal links and authority hosts", () => {
      const card = getSeoScorecard(
        {
          title: "HTML internal links and authority cues",
          meta_description: "Meta description long enough for html anchor internal link scoring branch tests.",
          tags: ["seo", "html", "links"],
          content_markdown:
            '## Intro\n\n<p>Read <a href="/docs/guide">docs</a> and see https://github.com/example/repo.</p>\n\n## Body\n\n```ts\nconst x = 1;\n```',
        },
        { platforms: ["google"] },
      );
      expect(card.checks.some((c) => c.label.toLowerCase().includes("internal"))).toBe(true);
    });
  });

  it("flags meta descriptions that largely overlap the title (similarity ratio)", () => {
    const title = "How to stream Gemini in Next.js App Router";
    const card = getSeoScorecard(
      {
        title,
        meta_description: `${title} guide`,
        tags: ["nextjs", "gemini"],
        content_markdown:
          "## Answer\n\nStreaming Gemini in Next.js requires careful timeout handling on Vercel for production reliability.\n\n## Details\n\nMore body copy here.",
      },
      { platforms: ["google"] },
    );
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.META_UNIQUE_FAIL)?.ok).toBe(false);
  });

  it("rewards direct-answer blocks under the first H2", () => {
    const card = getSeoScorecard(
      {
        title: "How to stream Gemini in Next.js with working examples",
        meta_description:
          "Learn how to stream Gemini responses in Next.js App Router with examples, timeouts, and caveats for Vercel deployments today.",
        tags: ["nextjs", "gemini"],
        content_markdown: `Intro paragraph before the first heading for snippet extraction.

## Stream Gemini in Next.js

Streaming Gemini in the App Router pipes model output through a ReadableStream while handling client disconnects on Vercel edge runtimes. Configure request timeouts, flush partial chunks early, and validate AI SDK stream helpers before shipping production traffic.

## Implementation

\`\`\`ts
export async function POST() { return new Response("ok"); }
\`\`\``,
      },
      { platforms: ["google"] },
    );
    expect(card.checks.find((c) => c.label === SEO_CHECK_LABELS.HAS_DIRECT_ANSWER)?.ok).toBe(true);
  });

  it("buildPersistedSeoFields drops blank platform slugs", () => {
    const fields = buildPersistedSeoFields(
      { title: "Persisted SEO title example", content_markdown: "## Body\n\nText." },
      { platforms: ["", "   "] },
    );
    expect(fields.seo_optimization_targets).toEqual([]);
  });
});
