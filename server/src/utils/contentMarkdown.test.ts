import { describe, expect, it } from "vitest";

import { ensureMarkdownContent } from "./contentMarkdown";

describe("ensureMarkdownContent", () => {
  it("returns empty string for nullish or blank input", () => {
    expect(ensureMarkdownContent(null)).toBe("");
    expect(ensureMarkdownContent("   ")).toBe("");
  });

  it("passes through plain markdown unchanged", () => {
    const md = "## Title\n\nHello **world**.";
    expect(ensureMarkdownContent(md)).toBe(md);
  });

  it("converts TipTap HTML blocks to markdown", () => {
    const html = "<p>Hello <strong>world</strong></p><p>Second line</p>";
    const out = ensureMarkdownContent(html);
    expect(out).toContain("Hello");
    expect(out).toContain("**world**");
    expect(out).not.toMatch(/<p>/i);
  });

  it("converts fenced code in pre/code blocks", () => {
    const html = '<pre><code class="language-ts">const x = 1;</code></pre>';
    const out = ensureMarkdownContent(html);
    expect(out).toContain("```ts");
    expect(out).toContain("const x = 1;");
  });
});
