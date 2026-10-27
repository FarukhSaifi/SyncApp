import { describe, expect, it } from "vitest";

import { LINKEDIN_POST } from "@constants/ai";

import {
  applyLinkedInReadMoreUrl,
  extractLinkedInReadMoreUrl,
  resolveLinkedInReadMoreUrl,
} from "./linkedinPost";

describe("linkedinPost helpers", () => {
  it("resolveLinkedInReadMoreUrl preserves absolute canonical URLs", () => {
    const url = resolveLinkedInReadMoreUrl("https://blog.example.com/my-post-slug", null);
    expect(url).toContain("https://blog.example.com/my-post-slug");
    expect(url).toContain("utm_source");
  });

  it("applyLinkedInReadMoreUrl inserts Read more before hashtags", () => {
    const body = `Intro line\n\n#tag1 #tag2`;
    const next = applyLinkedInReadMoreUrl(body, "https://blog.example.com/article");
    expect(next).toContain(LINKEDIN_POST.READ_MORE_PREFIX);
    expect(next.indexOf(LINKEDIN_POST.READ_MORE_PREFIX)).toBeLessThan(next.indexOf("#tag1"));
  });

  it("extractLinkedInReadMoreUrl reads URL from teaser", () => {
    const teaser = `Hello\n${LINKEDIN_POST.READ_MORE_PREFIX} https://blog.example.com/x?utm_source=linkedin`;
    expect(extractLinkedInReadMoreUrl(teaser)).toContain("https://blog.example.com/x");
  });

  it("applyLinkedInReadMoreUrl returns empty for blank input", () => {
    expect(applyLinkedInReadMoreUrl("", "https://blog.example.com/x")).toBe("");
    expect(applyLinkedInReadMoreUrl("  ", "https://blog.example.com/x")).toBe("");
  });

  it("applyLinkedInReadMoreUrl strips read more when URL is invalid", () => {
    const body = `Body\n${LINKEDIN_POST.READ_MORE_PREFIX} https://old.example.com`;
    expect(applyLinkedInReadMoreUrl(body, "not-a-url")).toBe("Body");
  });

  it("applyLinkedInReadMoreUrl appends read more when no hashtags", () => {
    const next = applyLinkedInReadMoreUrl("Only body", "https://blog.example.com/post");
    expect(next).toContain(LINKEDIN_POST.READ_MORE_PREFIX);
    expect(next).not.toContain("#");
  });

  it("resolveLinkedInReadMoreUrl returns undefined for relative paths without base", () => {
    expect(resolveLinkedInReadMoreUrl("/posts/my-slug", null)).toBeUndefined();
  });

  it("resolveLinkedInReadMoreUrl builds URL from slug path segment", () => {
    const url = resolveLinkedInReadMoreUrl(null, "my-slug");
    if (url) {
      expect(url).toContain("my-slug");
    }
  });
});
