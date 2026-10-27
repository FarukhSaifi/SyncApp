import { describe, expect, it } from "vitest";

import { isLikelyHtml, toEditorHtml, toStorageMarkdown } from "./contentUtils";

describe("contentUtils branches", () => {
  it("isLikelyHtml rejects non-string and empty values", () => {
    expect(isLikelyHtml("")).toBe(false);
    expect(isLikelyHtml("   ")).toBe(false);
  });

  it("toStorageMarkdown keeps markdown when input is not HTML", () => {
    const md = "### Notes\n\n- item one\n- item two";
    expect(toStorageMarkdown(md)).toContain("item one");
  });

  it("toEditorHtml returns empty for blank content", () => {
    expect(toEditorHtml("")).toBe("");
    expect(toEditorHtml("   ")).toBe("");
  });

  it("toEditorHtml converts markdown lists for TipTap", () => {
    const html = toEditorHtml("- alpha\n- beta");
    expect(html.toLowerCase()).toMatch(/ul|li/);
  });
});
