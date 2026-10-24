import { useCallback, useEffect, useRef, useState } from "react";

import { CACHE_TTL_MS, DEFAULT_PAGINATION, ERROR_MESSAGES, FILTER_STATUS_ALL } from "@constants";
import type {
  Pagination,
  Post,
  PostsApiResponse,
  PostsCacheEntry,
  PostsListFilters,
  PostsStats,
  UsePostsOptions,
  UsePostsReturn,
} from "@types";
import { apiClient } from "@utils/apiClient";
import { devError, devLog, devWarn } from "@utils/logger";

const postsCache = new Map<string, PostsCacheEntry>();

const EMPTY_POSTS_STATS: PostsStats = Object.freeze({
  total: 0,
  published: 0,
  drafts: 0,
  scheduled: 0,
  withPlatforms: 0,
});

export function clearPostsCache(): void {
  postsCache.clear();
}

function resolveTotalPages(pagination: Pagination): number {
  if (typeof pagination.totalPages === "number") {
    return Math.max(1, pagination.totalPages);
  }
  if (typeof pagination.total === "number" && pagination.limit > 0) {
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }
  return 1;
}

function normalizePostsStats(stats?: PostsApiResponse["stats"]): PostsStats {
  if (!stats) {
    return { ...EMPTY_POSTS_STATS };
  }
  return {
    total: stats.total ?? 0,
    published: stats.published ?? 0,
    drafts: stats.drafts ?? 0,
    scheduled: stats.scheduled ?? 0,
    withPlatforms: stats.withPlatforms ?? 0,
  };
}

export function usePosts(
  initialPaginationOrOptions: Pagination | UsePostsOptions = DEFAULT_PAGINATION,
): UsePostsReturn {
  const options: UsePostsOptions =
    initialPaginationOrOptions &&
    typeof initialPaginationOrOptions === "object" &&
    "enabled" in initialPaginationOrOptions
      ? (initialPaginationOrOptions as UsePostsOptions)
      : { enabled: true, pagination: initialPaginationOrOptions as Pagination };
  const { enabled = true, pagination: paginationOpt = DEFAULT_PAGINATION, userId = null } = options;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<Pagination>(paginationOpt);
  const [stats, setStats] = useState<PostsStats>({ ...EMPTY_POSTS_STATS });
  const [error, setError] = useState<string | null>(null);
  const loadingMoreLockRef = useRef(false);
  const filtersRef = useRef<PostsListFilters>({
    status: FILTER_STATUS_ALL,
    search: "",
  });
  const paginationRef = useRef(pagination);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  const fetchPosts = useCallback(
    async (opts: Partial<Pagination> & PostsListFilters & { append?: boolean } = {}) => {
      const { append = false, status, search, ...pageOpts } = opts;
      if (status !== undefined) {
        filtersRef.current.status = status;
      }
      if (search !== undefined) {
        filtersRef.current.search = search;
      }

      const currentFilters = filtersRef.current;
      const latestPagination = paginationRef.current;
      const params: Record<string, unknown> = {
        page: pageOpts.page ?? latestPagination.page ?? DEFAULT_PAGINATION.page,
        limit: pageOpts.limit ?? latestPagination.limit ?? DEFAULT_PAGINATION.limit,
      };
      if (currentFilters.status && currentFilters.status !== FILTER_STATUS_ALL) {
        params.status = currentFilters.status;
      }
      if (currentFilters.search?.trim()) {
        params.search = currentFilters.search.trim();
      }

      if (append) {
        if (loadingMoreLockRef.current) {
          return;
        }
        loadingMoreLockRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const cacheKey = JSON.stringify({ ...params, userId });

        if (!append) {
          const cached = postsCache.get(cacheKey);
          if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            devLog("Using cached posts for params:", params);
            setPosts(cached.data);
            setPagination(cached.pagination);
            if (cached.stats) {
              setStats(cached.stats);
            }
            return;
          }
        }

        devLog("Fetching posts with params:", params, append ? "(append)" : "");
        const response = (await apiClient.getPosts(params)) as unknown as PostsApiResponse;

        if (response && response.success) {
          const fetchedData = response.data || [];
          const nextStats = normalizePostsStats(response.stats);
          devLog("Posts fetched:", fetchedData.length);
          if (append) {
            setPosts((prev) => {
              const seen = new Set(prev.map((p) => p._id));
              const merged = [...prev];
              for (const post of fetchedData) {
                if (!seen.has(post._id)) {
                  merged.push(post);
                }
              }
              return merged;
            });
          } else {
            setPosts(fetchedData);
          }
          setStats(nextStats);
          if (response.pagination) {
            setPagination(response.pagination);
            if (!append) {
              postsCache.set(cacheKey, {
                data: fetchedData,
                pagination: response.pagination,
                stats: nextStats,
                timestamp: Date.now(),
              });
            }
          }
        } else {
          devWarn("API returned unsuccessful response:", response);
          setError(response?.error || ERROR_MESSAGES.FAILED_TO_FETCH_POSTS);
          if (!append) {
            setPosts([]);
          }
        }
      } catch (err) {
        devError("Error fetching posts:", err);
        setError((err as Error)?.message || ERROR_MESSAGES.FAILED_TO_FETCH_POSTS);
        if (!append) {
          setPosts([]);
        }
      } finally {
        if (append) {
          loadingMoreLockRef.current = false;
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [userId],
  );

  useEffect(() => {
    if (enabled && userId) {
      void fetchPosts({
        page: DEFAULT_PAGINATION.page,
        limit: paginationOpt.limit ?? DEFAULT_PAGINATION.limit,
      });
    } else {
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      setPosts([]);
      setStats({ ...EMPTY_POSTS_STATS });
      postsCache.clear();
    }
    // Initial load only when auth/user enablement changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId, fetchPosts]);

  const totalPages = resolveTotalPages(pagination);
  const hasMore = pagination.page < totalPages;

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || loadingMore || loadingMoreLockRef.current) {
      return;
    }
    await fetchPosts({
      page: pagination.page + 1,
      limit: pagination.limit,
      append: true,
    });
  }, [fetchPosts, hasMore, loading, loadingMore, pagination.limit, pagination.page]);

  const goToPage = useCallback(
    async (page: number) => {
      const nextPage = Math.max(1, Math.min(page, totalPages));
      if (nextPage === pagination.page && !loading) {
        return;
      }
      postsCache.clear();
      await fetchPosts({
        page: nextPage,
        limit: pagination.limit,
        append: false,
      });
    },
    [fetchPosts, loading, pagination.limit, pagination.page, totalPages],
  );

  const resetAndFetch = useCallback(
    async (opts: Partial<Pagination> & PostsListFilters = {}) => {
      postsCache.clear();
      await fetchPosts({
        page: opts.page ?? DEFAULT_PAGINATION.page,
        limit: opts.limit ?? pagination.limit ?? DEFAULT_PAGINATION.limit,
        status: opts.status,
        search: opts.search,
        append: false,
      });
    },
    [fetchPosts, pagination.limit],
  );

  const addPost = useCallback((newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const updatePost = useCallback((updatedPost: Partial<Post> & { id?: string; _id?: string }) => {
    setPosts((prev) =>
      prev.map((post) => {
        const postId = post._id;
        const updatedId = updatedPost._id || updatedPost.id;
        return postId === updatedId ? ({ ...post, ...updatedPost } as Post) : post;
      }),
    );
    postsCache.clear();
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.filter((post) => {
        const currentId = post._id;
        return currentId !== postId;
      }),
    );
    postsCache.clear();
  }, []);

  const refreshPosts = useCallback(() => {
    postsCache.clear();
    void fetchPosts({ page: pagination.page, limit: pagination.limit });
  }, [fetchPosts, pagination.limit, pagination.page]);

  return {
    posts,
    loading,
    loadingMore,
    error,
    pagination,
    stats,
    hasMore,
    totalPages,
    fetchPosts,
    loadMore,
    goToPage,
    resetAndFetch,
    refreshPosts,
    addPost,
    updatePost,
    deletePost,
    setPagination,
  };
}
