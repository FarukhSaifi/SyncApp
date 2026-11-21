import { describe, expect, it } from "vitest";

import { resolveWordpressHtmlContent } from "./wordpressContent";

describe("wordpressContent", () => {
  it("returns empty string for blank input", () => {
    expect(resolveWordpressHtmlContent("")).toBe("");
    expect(resolveWordpressHtmlContent("   \n\t  ")).toBe("");
  });

  it("passes through HTML content", () => {
    const html = "<p>Hello <strong>world</strong></p>";
    expect(resolveWordpressHtmlContent(html)).toBe(html);
  });

  it("passes through HTML that starts after leading whitespace", () => {
    const html = "  \n<div><em>TipTap</em></div>";
    expect(resolveWordpressHtmlContent(html)).toBe(html);
  });

  it("converts markdown headings and paragraphs to HTML", () => {
    const out = resolveWordpressHtmlContent("## Title\n\nBody **bold**");
    expect(out).toContain("<h2>Title</h2>");
    expect(out).toContain("<p>");
    expect(out).toContain("<strong>bold</strong>");
  });

  it("converts inline emphasis, code, and links", () => {
    const out = resolveWordpressHtmlContent("See *em* and `code` plus [docs](https://example.com/a)");
    expect(out).toContain("<em>em</em>");
    expect(out).toContain("<code>code</code>");
    expect(out).toContain('<a href="https://example.com/a" rel="noopener noreferrer">docs</a>');
  });

  it("escapes raw HTML characters in markdown text", () => {
    const out = resolveWordpressHtmlContent("Use <script> and & quotes \"x\"");
    expect(out).toContain("&lt;script&gt;");
    expect(out).toContain("&amp;");
    expect(out).toContain("&quot;");
    expect(out).not.toContain("<script>");
  });

  it("does not treat plain text starting with < as HTML without a tag", () => {
    const out = resolveWordpressHtmlContent("< not a tag");
    expect(out).toContain("<p>");
    expect(out).toContain("&lt; not a tag");
  });
});
