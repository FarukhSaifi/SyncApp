import { config } from "@config";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import Post from "./Post";

import { startMemoryMongo, stopMemoryMongo } from "../__tests__/helpers/memoryMongo";


describe("Post model hooks and virtuals", () => {
  const authorId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    await startMemoryMongo();
  }, 120_000);

  afterAll(async () => {
    await stopMemoryMongo();
  });

  it("generates slug suffix when title collides", async () => {
    await Post.create({ title: "Collision Title", author: authorId, content_markdown: "Body" });
    const second = await Post.create({ title: "Collision Title", author: authorId, content_markdown: "Body two" });
    expect(second.slug).toMatch(/collision-title-2$/);
  });

  it("uses UUID slug suffix after max suffix attempts", async () => {
    const existsSpy = vi.spyOn(Post, "exists").mockImplementation(((query: unknown) => {
      const slug = (query as { slug?: string }).slug || "";
      if (slug.includes("uuid-slug-test") && !/^[a-f0-9-]{8,}$/.test(slug.split("-").pop() || "")) {
        return Promise.resolve({ _id: new mongoose.Types.ObjectId() });
      }
      return Promise.resolve(null);
    }) as typeof Post.exists);

    const doc = new Post({
      title: "UUID Slug Test",
      author: authorId,
      content_markdown: "Body",
    });
    await doc.validate();
    expect(doc.slug).toContain("uuid-slug-test");
    expect(doc.slug!.length).toBeGreaterThan("uuid-slug-test".length);
    existsSpy.mockRestore();
  });

  it("skips slug regeneration when title is unchanged", async () => {
    const post = await Post.create({
      title: "Stable Slug Post",
      author: authorId,
      content_markdown: "Body",
    });
    const originalSlug = post.slug;
    post.content_markdown = "Updated body only";
    await post.save();
    expect(post.slug).toBe(originalSlug);
  });

  it("sets canonical_url from site base or slug fallback", async () => {
    config.canonicalBaseUrl = "https://blog.example.com";
    const withBase = await Post.create({
      title: "Canonical Base Post",
      author: authorId,
      content_markdown: "Body",
    });
    expect(withBase.canonical_url).toBe(`https://blog.example.com/${withBase.slug}`);

    config.canonicalBaseUrl = "";
    const fallback = await Post.create({
      title: "Canonical Fallback Post",
      author: authorId,
      content_markdown: "Body",
    });
    expect(fallback.canonical_url).toBe(fallback.slug);
  });

  it("exposes timestamp virtuals and publish-anywhere flag", async () => {
    const post = await Post.create({
      title: "Virtual Fields Post",
      author: authorId,
      content_markdown: "Body",
      platform_status: {
        devto: { published: true, url: "https://dev.to/x" },
        medium: { published: false },
      },
    });
    expect(post.created_at).toBeInstanceOf(Date);
    expect(post.updated_at).toBeInstanceOf(Date);
    expect(post.is_published_anywhere).toBe(true);

    post.platform_status = undefined;
    expect(post.is_published_anywhere).toBe(false);
  });
});
