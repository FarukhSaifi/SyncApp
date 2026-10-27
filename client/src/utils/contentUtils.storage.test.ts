import { describe, expect, it } from "vitest";

import { htmlToMarkdown, isLikelyHtml, toEditorHtml, toStorageMarkdown } from "./contentUtils";

describe("contentUtils storage and mixed formats", () => {
  it("isLikelyHtml returns false for non-string input", () => {
    expect(isLikelyHtml(null as unknown as string)).toBe(false);
  });

  it("htmlToMarkdown returns empty for blank HTML", () => {
    expect(htmlToMarkdown("")).toBe("");
    expect(htmlToMarkdown("   ")).toBe("");
  });

  it("toStorageMarkdown prefers HTML when block tags dominate mixed content", () => {
    const mixed = "<p>Intro</p>\n<p>More</p>\n## Not really heading in storage";
    const stored = toStorageMarkdown(mixed);
    expect(stored).not.toContain("<p>");
    expect(stored.toLowerCase()).toContain("intro");
  });

  it("toStorageMarkdown keeps markdown when not HTML-like", () => {
    const md = "> quote\n\nPlain **bold** text";
    expect(toStorageMarkdown(md)).toContain("bold");
  });

  it("toEditorHtml passes through pure HTML", () => {
    const html = "<p>Already HTML</p>";
    expect(toEditorHtml(html)).toBe(html);
  });

  it("toEditorHtml converts plain prose with paragraph breaks via markdown", () => {
    const prose = "First paragraph.\n\nSecond paragraph.";
    const html = toEditorHtml(prose);
    expect(html.length).toBeGreaterThan(prose.length);
  });

  it("toEditorHtml returns trimmed plain text when no markdown signals", () => {
    const plain = "Single line without breaks";
    expect(toEditorHtml(plain)).toBe(plain);
  });
});
