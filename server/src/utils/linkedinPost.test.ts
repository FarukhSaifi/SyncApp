import { config } from "@config";
import { AI_POST_LIMITS } from "@constants";
import { afterEach, describe, expect, it } from "vitest";

import { UTM_PARAM_KEYS, UTM_SOURCES } from "@constants/utm";

import {
  buildReadMoreUrl,
  finalizeLinkedInPost,
  insertReadMoreBeforeHashtags,
  slugifyArticlePath,
} from "./linkedinPost";

describe("linkedinPost helpers", () => {
  const originalBase = config.canonicalBaseUrl;

  afterEach(() => {
    config.canonicalBaseUrl = originalBase;
  });

  it("slugifyArticlePath lowercases and strict-slugs", () => {
    expect(slugifyArticlePath("Hello World!")).toBe("hello-world");
    expect(slugifyArticlePath("   ")).toBe("post");
  });

  it("buildReadMoreUrl returns undefined when canonical base is missing", () => {
    config.canonicalBaseUrl = "";
    expect(buildReadMoreUrl("My Title")).toBeUndefined();
  });

  it("buildReadMoreUrl uses AI slug hint and appends LinkedIn UTM", () => {
    config.canonicalBaseUrl = "https://blog.example.com";
    const url = buildReadMoreUrl("Fallback Title", "custom-slug");
    expect(url).toBeDefined();
    const parsed = new URL(url as string);
    expect(parsed.pathname).toBe("/custom-slug");
    expect(parsed.searchParams.get(UTM_PARAM_KEYS.SOURCE)).toBe(UTM_SOURCES.LINKEDIN);
    expect(parsed.searchParams.get(UTM_PARAM_KEYS.CONTENT)).toBe("custom-slug");
  });

  it("insertReadMoreBeforeHashtags places read-more before trailing hashtags", () => {
    const body = "Intro line\n\n#syncapp #dev";
    const readMore = `${AI_POST_LIMITS.LINKEDIN_READ_MORE_PREFIX} https://example.com/a`;
    const out = insertReadMoreBeforeHashtags(body, readMore);
    expect(out.indexOf("Intro line")).toBeLessThan(out.indexOf(readMore));
    expect(out.indexOf(readMore)).toBeLessThan(out.indexOf("#syncapp"));
  });

  it("finalizeLinkedInPost strips fake read-more and inserts canonical URL", () => {
    config.canonicalBaseUrl = "https://blog.example.com";
    const readMore = buildReadMoreUrl("Title", "my-post");
    const draft = `Body text\n\nRead more: https://fake.example/old\n\n#tag`;
    const finalized = finalizeLinkedInPost(draft, readMore);
    expect(finalized).not.toContain("fake.example");
    expect(finalized).toContain(readMore as string);
    expect(finalized).toContain("#tag");
  });
});
