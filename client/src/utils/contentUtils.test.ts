import { describe, expect, it } from "vitest";

import {
  htmlToMarkdown,
  isLikelyHtml,
  markdownToHtml,
  normalizeMarkdownNewlines,
  toEditorHtml,
  toStorageMarkdown,
} from "./contentUtils";

describe("contentUtils (TipTap storage bridge)", () => {
  it("detects HTML vs markdown", () => {
    expect(isLikelyHtml("<p>Hello</p>")).toBe(true);
    expect(isLikelyHtml("## Heading\n\nBody")).toBe(false);
  });

  it("normalizeMarkdownNewlines expands escaped breaks when needed", () => {
    expect(normalizeMarkdownNewlines("line1\\nline2")).toContain("line2");
    expect(normalizeMarkdownNewlines("")).toBe("");
  });

  it("markdownToHtml and htmlToMarkdown convert fenced code", () => {
    const md = "```js\nconst x = 1;\n```";
    const html = markdownToHtml(md);
    expect(html).toContain("code");
    const back = htmlToMarkdown(html);
    expect(back).toContain("const x = 1");
  });

  it("round-trips markdown through editor HTML for TipTap", () => {
    const md = "## Hello\n\nParagraph with **bold**.";
    const html = toEditorHtml(md);
    expect(html).toContain("Hello");
    const stored = toStorageMarkdown(html);
    expect(stored).toContain("Hello");
    expect(stored.toLowerCase()).toContain("bold");
  });
});
