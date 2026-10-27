import { describe, expect, it } from "vitest";

import { UTM_CAMPAIGNS, UTM_MEDIUMS, UTM_PARAM_KEYS, UTM_SOURCES } from "@constants/utm";

import { appendUtmParams } from "./utm";

describe("appendUtmParams", () => {
  it("returns non-http URLs unchanged", () => {
    expect(appendUtmParams("mailto:a@b.com", { source: UTM_SOURCES.LINKEDIN })).toBe("mailto:a@b.com");
    expect(appendUtmParams("", { source: UTM_SOURCES.LINKEDIN })).toBe("");
  });

  it("sets UTM params and derives content slug from path", () => {
    const result = appendUtmParams("https://example.com/blog/my-post/", {
      source: UTM_SOURCES.DEVTO,
    });
    const url = new URL(result);
    expect(url.searchParams.get(UTM_PARAM_KEYS.SOURCE)).toBe(UTM_SOURCES.DEVTO);
    expect(url.searchParams.get(UTM_PARAM_KEYS.MEDIUM)).toBe(UTM_MEDIUMS.SOCIAL);
    expect(url.searchParams.get(UTM_PARAM_KEYS.CAMPAIGN)).toBe(UTM_CAMPAIGNS.SYNCAPP);
    expect(url.searchParams.get(UTM_PARAM_KEYS.CONTENT)).toBe("my-post");
  });

  it("returns trimmed input when URL parsing fails", () => {
    const bad = "https://not a valid url";
    expect(appendUtmParams(bad, { source: UTM_SOURCES.LINKEDIN })).toBe(bad);
  });

  it("replaces existing utm params (idempotent)", () => {
    const first = appendUtmParams("https://x.test/p?utm_source=old", {
      source: UTM_SOURCES.MEDIUM,
      content: "slug-a",
    });
    const second = appendUtmParams(first, {
      source: UTM_SOURCES.WORDPRESS,
      content: "slug-b",
    });
    const url = new URL(second);
    expect(url.searchParams.get(UTM_PARAM_KEYS.SOURCE)).toBe(UTM_SOURCES.WORDPRESS);
    expect(url.searchParams.get(UTM_PARAM_KEYS.CONTENT)).toBe("slug-b");
  });
});
