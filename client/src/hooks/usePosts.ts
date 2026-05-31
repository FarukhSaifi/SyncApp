import { useCallback, useEffect, useMemo, useState } from "react";

import { CACHE_TTL_MS, DEFAULT_PAGINATION, ERROR_MESSAGES, POST_STATUS } from "@constants";
import type {
  Pagination,
  Post,
  PostsApiResponse,
  PostsCacheEntry,
  PostsStats,
  UsePostsOptions,
  UsePostsReturn,
} from "@types";
import { apiClient } from "@utils/apiClient";
import { devError, devLog, devWarn } from "@utils/logger";

const postsCache = new Map<string, PostsCacheEntry>();

export function usePosts(
  initialPaginationOrOptions: Pagination | UsePostsOptions = DEFAULT_PAGINATION,
): UsePostsReturn {
  const options: UsePostsOptions =
    initialPaginationOrOptions &&
    typeof initialPaginationOrOptions === "object" &&
    "enabled" in initialPaginationOrOptions
      ? (initialPaginationOrOptions as UsePostsOptions)
      : { enabled: true, pagination: initialPaginationOrOptions as Pagination };
  const { enabled = true, pagination: paginationOpt = DEFAULT_PAGINATION } = options;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [pagination, setPagination] = useState<Pagination>(paginationOpt);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (opts: Partial<Pagination> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = opts.page !== undefined || opts.limit !== undefined ? opts : DEFAULT_PAGINATION;
      const cacheKey = JSON.stringify(params);

      // Check cache first
      const cached = postsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        devLog("Using cached posts for params:", params);
        setPosts(cached.data);
        setPagination(cached.pagination);
        setLoading(false);
        return;
      }

      devLog("Fetching posts with params:", params);
      const response = (await apiClient.getPosts(params)) as unknown as PostsApiResponse;

      if (response && response.success) {
        devLog("Posts fetched:", response.data?.length ?? 0);
        const fetchedData = response.data || [];
        setPosts(fetchedData);
        if (response.pagination) {
          setPagination(response.pagination);
          // Set cache
          postsCache.set(cacheKey, {
            data: fetchedData,
            pagination: response.pagination,
            timestamp: Date.now(),
          });
        }
      } else {
        devWarn("API returned unsuccessful response:", response);
        setError(response?.error || ERROR_MESSAGES.FAILED_TO_FETCH_POSTS);
        setPosts([]);
      }
    } catch (err) {
      devError("Error fetching posts:", err);
      setError((err as Error)?.message || ERROR_MESSAGES.FAILED_TO_FETCH_POSTS);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchPosts();
    } else {
      setLoading(false);
      setError(null);
    }
  }, [enabled, fetchPosts]); // Fetch when enabled (e.g. user becomes authenticated)

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
    // Invalidate global cache to prevent stale data reading
    postsCache.clear();
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.filter((post) => {
        const currentId = post._id;
        return currentId !== postId;
      }),
    );
    // Invalidate global cache
    postsCache.clear();
  }, []);

  const refreshPosts = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  const stats = useMemo<PostsStats>(
    () => ({
      total: posts.length,
      published: posts.filter((p) => p.status === POST_STATUS.PUBLISHED).length,
      drafts: posts.filter((p) => p.status === POST_STATUS.DRAFT).length,
      withPlatforms: posts.filter(
        (p) =>
          p.platform_status &&
          (p.platform_status.medium?.published ||
            p.platform_status.devto?.published ||
            p.platform_status.wordpress?.published),
      ).length,
    }),
    [posts],
  );

  return {
    posts,
    loading,
    error,
    pagination,
    stats,
    fetchPosts,
    refreshPosts,
    addPost,
    updatePost,
    deletePost,
    setPagination,
  };
}
