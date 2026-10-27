import { CACHE_TTL_MS, DEFAULT_PAGINATION, FILTER_STATUS_ALL } from "@constants";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST_STATUS } from "@constants/postStatus";

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

const postFixture = {
  _id: "p1",
  title: "T",
  content_markdown: "",
  status: POST_STATUS.DRAFT,
  tags: [],
  author: "u1",
};

describe("usePosts branches", () => {
  beforeEach(() => {
    clearPostsCache();
    getPosts.mockReset();
    vi.useRealTimers();
  });

  it("accepts legacy pagination-only argument shape", async () => {
    getPosts.mockResolvedValue({
      success: true,
      data: [postFixture],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    const { result } = renderHook(() => usePosts({ page: 1, limit: 10 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(getPosts).toHaveBeenCalled();
    expect(result.current.posts).toHaveLength(1);
  });

  it("serves cached posts within TTL without refetching", async () => {
    getPosts.mockResolvedValue({
      success: true,
      data: [postFixture],
      pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
      stats: { total: 1, published: 0, drafts: 1, scheduled: 0, withPlatforms: 0 },
    });

    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    const { result } = renderHook(() => usePosts({ enabled: true, userId: "user-1" }));
    await waitFor(() => {
      expect(result.current.posts).toHaveLength(1);
    });

    getPosts.mockClear();
    vi.spyOn(Date, "now").mockReturnValue(now + CACHE_TTL_MS - 1000);

    await act(async () => {
      await result.current.resetAndFetch({ page: 1, limit: 5 });
    });

    expect(getPosts).not.toHaveBeenCalled();
    expect(result.current.posts).toHaveLength(1);
  });

  it("goToPage fetches the requested page", async () => {
    getPosts.mockResolvedValue({
      success: true,
      data: [postFixture],
      pagination: { page: 1, limit: 5, total: 12, totalPages: 3 },
      stats: { total: 12, published: 0, drafts: 12, scheduled: 0, withPlatforms: 0 },
    });

    const { result } = renderHook(() => usePosts({ enabled: true, userId: "user-1" }));
    await waitFor(() => {
      expect(result.current.totalPages).toBe(3);
    });

    getPosts.mockClear();
    getPosts.mockResolvedValue({
      success: true,
      data: [{ ...postFixture, _id: "p2" }],
      pagination: { page: 2, limit: 5, total: 12, totalPages: 3 },
    });

    await act(async () => {
      await result.current.goToPage(2);
    });

    expect(getPosts).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 5 }));
    expect(result.current.pagination.page).toBe(2);
  });

  it("resetAndFetch applies status and search filters", async () => {
    getPosts.mockResolvedValue({
      success: true,
      data: [postFixture],
      pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
    });

    const { result } = renderHook(() => usePosts({ enabled: true, userId: "user-1" }));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    getPosts.mockClear();
    await act(async () => {
      await result.current.resetAndFetch({
        status: POST_STATUS.PUBLISHED,
        search: "  hello  ",
        page: DEFAULT_PAGINATION.page,
        limit: DEFAULT_PAGINATION.limit,
      });
    });

    expect(getPosts).toHaveBeenCalledWith(
      expect.objectContaining({
        status: POST_STATUS.PUBLISHED,
        search: "hello",
      }),
    );
  });

  it("handles thrown fetch errors", async () => {
    getPosts.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => usePosts({ enabled: true, userId: "user-1" }));

    await waitFor(() => {
      expect(result.current.error).toBe("network down");
      expect(result.current.posts).toEqual([]);
    });
  });

  it("clears state when disabled without user id", async () => {
    getPosts.mockResolvedValue({
      success: true,
      data: [postFixture],
      pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
    });

    const { result, rerender } = renderHook(
      ({ enabled, userId }: { enabled: boolean; userId: string | null }) => usePosts({ enabled, userId }),
      { initialProps: { enabled: true, userId: "user-1" as string | null } },
    );

    await waitFor(() => {
      expect(result.current.posts).toHaveLength(1);
    });

    rerender({ enabled: false, userId: null });

    await waitFor(() => {
      expect(result.current.posts).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.stats.total).toBe(0);
    });
    expect(getPosts).toHaveBeenCalledTimes(1);
  });

  it("ignores filter status when set to all", async () => {
    getPosts.mockResolvedValue({
      success: true,
      data: [postFixture],
      pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
    });

    const { result } = renderHook(() => usePosts({ enabled: true, userId: "user-1" }));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    getPosts.mockClear();
    await act(async () => {
      await result.current.resetAndFetch({ status: FILTER_STATUS_ALL });
    });

    const lastCall = getPosts.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(lastCall.status).toBeUndefined();
  });
});
