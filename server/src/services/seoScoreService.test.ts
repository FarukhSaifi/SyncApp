/**
 * Lightweight SEO scorecard tests (node:test + tsx).
 * Run: npx tsx --test src/services/seoScoreService.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPersistedSeoFields, getSeoScorecard } from "./seoScoreService";

describe("getSeoScorecard", () => {
  it("scores an empty post low without body (rescaled metadata-only path)", () => {
    const card = getSeoScorecard({});
    assert.ok(card.score < 20);
    assert.equal(card.maxScore, 100);
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
    assert.ok(card.score > 0);
    assert.ok(card.score <= 100);
    assert.ok(card.checks.some((c) => c.label.includes("Title")));
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
    assert.notEqual(googleCard.summary, devCard.summary);
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
    assert.equal(typeof fields.seo_score, "number");
    assert.equal(fields.seo_primary_keyword, "stream gemini");
    assert.deepEqual(fields.seo_optimization_targets, ["google"]);
  });
});
