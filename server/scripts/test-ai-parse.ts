/**
 * Quick sanity checks for AI JSON parsing (no Vertex credentials required).
 * Run: cd server && npx tsx scripts/test-ai-parse.ts
 */
import { parseJSONContent, assertValidPostResult } from "../src/utils/aiResponseParse";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const sample = JSON.stringify({
  title: "Building a Blog Syndication Platform with Next.js",
  meta_description: "How to publish once and syndicate everywhere using Next.js and MongoDB.",
  tags: ["webdev", "nextjs", "mongodb", "typescript"],
  content_markdown: "## Intro\n\nHere is the post body.",
  canonical_url: "",
});

const parsed = parseJSONContent(sample);
assert(parsed.title.length > 0, "title should parse");
assert(parsed.content.includes("Intro"), "content_markdown should map to content");
assert(parsed.tags.length === 4, "tags should parse");
assert(parsed.canonical_url === "", "canonical_url should parse");

const fenced = parseJSONContent("```json\n" + sample + "\n```");
assert(fenced.title.length > 0, "fenced JSON should parse");

const withNewlines = parseJSONContent(
  `{"title":"Test","meta_description":"Desc","tags":["ai"],"content_markdown":"Line1\nLine2","canonical_url":""}`,
);
assert(withNewlines.content.includes("Line1"), "literal newlines in JSON strings should parse");

console.log("✅ AI parse tests passed");
