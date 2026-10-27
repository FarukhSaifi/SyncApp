import { describe, expect, it } from "vitest";

import { buildCoverFilename, buildInlineImageFilename, resolvePostMediaSlug, slugifyMediaName } from "./mediaFilename";

describe("mediaFilename", () => {
  it("slugifyMediaName lowercases and dashes", () => {
    expect(slugifyMediaName("Hello World!")).toMatch(/hello-world/);
  });

  it("buildCoverFilename includes cover prefix and extension", () => {
    const name = buildCoverFilename({ title: "My Post", ext: "png", postId: "abc123" });
    expect(name.startsWith("cover-")).toBe(true);
    expect(name.endsWith(".png")).toBe(true);
  });

  it("resolvePostMediaSlug prefers slug then title then postId", () => {
    expect(resolvePostMediaSlug({ slug: "My Slug", title: "Title", postId: "id" })).toBe("my-slug");
    expect(resolvePostMediaSlug({ title: "Title Only", postId: "id" })).toMatch(/title-only/);
    expect(resolvePostMediaSlug({ postId: "abc123" })).toMatch(/abc123/);
    expect(resolvePostMediaSlug({})).toBe("post");
  });

  it("buildInlineImageFilename includes index", () => {
    const name = buildInlineImageFilename({ title: "Post", index: 2, ext: "jpg" });
    expect(name).toMatch(/^inline-post-2\.jpg$/);
  });
});
