import { describe, expect, it } from "vitest";

import { isLocalOnlyOnSaveField, PLATFORM_SYNC } from "./platformSync";

describe("PLATFORM_SYNC", () => {
  it("lists schedule, SEO, and status as local-only on save", () => {
    expect(PLATFORM_SYNC.LOCAL_ONLY_ON_SAVE).toEqual([
      "scheduled_for",
      "scheduled_platforms",
      "seo_score",
      "seo_score_summary",
      "seo_primary_keyword",
      "seo_optimization_targets",
      "status",
    ]);
  });

  it("keeps DEV.to syncable fields disjoint from local-only fields", () => {
    const local = new Set<string>(PLATFORM_SYNC.LOCAL_ONLY_ON_SAVE);
    for (const field of PLATFORM_SYNC.DEVTO_SYNCABLE_ON_SAVE) {
      expect(local.has(field)).toBe(false);
    }
  });

  it("keeps WordPress syncable fields disjoint from local-only fields", () => {
    const local = new Set<string>(PLATFORM_SYNC.LOCAL_ONLY_ON_SAVE);
    for (const field of PLATFORM_SYNC.WORDPRESS_SYNCABLE_ON_SAVE) {
      expect(local.has(field)).toBe(false);
    }
  });

  it("documents WordPress SEO meta as plugin-dependent API limitation", () => {
    expect(PLATFORM_SYNC.WORDPRESS_SEO_META_SYNC).toBe("unsupported_needs_seo_plugin");
    expect(PLATFORM_SYNC.WORDPRESS_SYNCABLE_ON_SAVE).toEqual([
      "title",
      "content_markdown",
      "tags",
      "cover_image",
    ]);
  });

  it("marks LinkedIn cover sync as not applicable for text UGC", () => {
    expect(PLATFORM_SYNC.LINKEDIN_COVER_SYNC).toBe("not_applicable");
  });

  it("documents Medium create-only and LinkedIn no edit-in-place save sync", () => {
    expect(PLATFORM_SYNC.MEDIUM_SAVE_SYNC).toBe("unsupported_create_only");
    expect(PLATFORM_SYNC.LINKEDIN_SAVE_SYNC).toBe("unsupported_no_edit_in_place");
  });

  it("isLocalOnlyOnSaveField recognizes schedule and SEO keys only", () => {
    expect(isLocalOnlyOnSaveField("seo_score")).toBe(true);
    expect(isLocalOnlyOnSaveField("scheduled_for")).toBe(true);
    expect(isLocalOnlyOnSaveField("status")).toBe(true);
    expect(isLocalOnlyOnSaveField("title")).toBe(false);
    expect(isLocalOnlyOnSaveField("cover_image")).toBe(false);
  });
});

