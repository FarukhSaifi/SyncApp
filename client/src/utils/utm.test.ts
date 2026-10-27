import { describe, expect, it } from "vitest";

import { UTM_CAMPAIGNS, UTM_MEDIUMS, UTM_PARAM_KEYS, UTM_SOURCES } from "@constants/utm";

import { appendUtmParams } from "./utm";

describe("appendUtmParams", () => {
  it("returns non-http URLs unchanged", () => {
    expect(appendUtmParams("ftp://files.test/x", { source: UTM_SOURCES.SYNCAPP })).toBe(
      "ftp://files.test/x",
    );
  });

  it("appends default medium and campaign with explicit content", () => {
    const out = appendUtmParams("https://blog.test/read-more", {
      source: UTM_SOURCES.LINKEDIN,
      content: "cta-link",
    });
    const url = new URL(out);
    expect(url.searchParams.get(UTM_PARAM_KEYS.SOURCE)).toBe(UTM_SOURCES.LINKEDIN);
    expect(url.searchParams.get(UTM_PARAM_KEYS.MEDIUM)).toBe(UTM_MEDIUMS.SOCIAL);
    expect(url.searchParams.get(UTM_PARAM_KEYS.CAMPAIGN)).toBe(UTM_CAMPAIGNS.SYNCAPP);
    expect(url.searchParams.get(UTM_PARAM_KEYS.CONTENT)).toBe("cta-link");
  });

  it("derives content from final path segment when omitted", () => {
    const out = appendUtmParams("https://blog.test/posts/deep/nested/slug", {
      source: UTM_SOURCES.DEVTO,
    });
    expect(new URL(out).searchParams.get(UTM_PARAM_KEYS.CONTENT)).toBe("slug");
  });

  it("returns trimmed input unchanged for empty or invalid http URLs", () => {
    expect(appendUtmParams("", { source: UTM_SOURCES.SYNCAPP })).toBe("");
    expect(appendUtmParams("  ", { source: UTM_SOURCES.SYNCAPP })).toBe("");
  });
});
