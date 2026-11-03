import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearPostsCache, usePosts } from "./usePosts";

const getPosts = vi.hoisted(() => vi.fn());

vi.mock("@utils/apiClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@utils/apiClient")>();
  return {
    ...mod,
    apiClient: {
      ...mod.apiClient,
      getPosts: (...args: unknown[]) => getPosts(...args),
    },
  };
});

describe("usePosts", () => {
  beforeEach(() => {
    clearPostsCache();
    getPosts.mockReset();
  });

  it("loads posts and stats on mount", async () => {
    getPosts.mockResolvedValue({
      success: true,
      data: [{ _id: "p1", title: "T", content_markdown: "", status: "draft", tags: [], author: "u1" }],
      pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
      stats: { total: 1, published: 0, drafts: 1, scheduled: 0, withPlatforms: 0 },
    });

    const { result } = renderHook(() => usePosts({ enabled: true, userId: "user-1" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.stats.total).toBe(1);
  });

  it("surfaces API errors", async () => {
    getPosts.mockResolvedValue({ success: false, error: "fail" });

    const { result } = renderHook(() => usePosts({ enabled: true, userId: "user-1" }));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it("skips fetch when disabled", async () => {
    const { result } = renderHook(() => usePosts({ enabled: false, userId: "user-1" }));
    expect(result.current.loading).toBe(false);
    expect(getPosts).not.toHaveBeenCalled();
  });

  it("uses cache on repeated fetch with same params", async () => {
    getPosts.mockResolvedValue({
      success: true,
      data: [{ _id: "p1", title: "T", content_markdown: "", status: "draft", tags: [], author: "u1" }],
      pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
      stats: { total: 1, published: 0, drafts: 1, scheduled: 0, withPlatforms: 0 },
    });

    const { result } = renderHook(() => usePosts({ enabled: true, userId: "user-1" }));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    getPosts.mockClear();
    result.current.refreshPosts();
    await waitFor(() => {
      expect(getPosts).toHaveBeenCalledOnce();
    });
  });

  it("mutates local list via add, update, and delete helpers", async () => {
    getPosts.mockResolvedValue({
      success: true,
      data: [{ _id: "p1", title: "Old", content_markdown: "", status: "draft", tags: [], author: "u1" }],
      pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
    });

    const { result } = renderHook(() => usePosts({ enabled: true, userId: "user-1" }));
    await waitFor(() => {
      expect(result.current.posts).toHaveLength(1);
    });

    act(() => {
      result.current.addPost({
        _id: "p2",
        title: "New",
        content_markdown: "",
        status: "draft",
        tags: [],
        author: "u1",
      });
    });
    expect(result.current.posts).toHaveLength(2);

    act(() => {
      result.current.updatePost({ _id: "p1", title: "Updated" });
    });
    expect(result.current.posts.find((p) => p._id === "p1")?.title).toBe("Updated");

    act(() => {
      result.current.deletePost("p2");
    });
    expect(result.current.posts.some((p) => p._id === "p2")).toBe(false);
  });
});
