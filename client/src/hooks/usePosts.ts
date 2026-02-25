import { useCallback, useEffect, useMemo, useState } from "react";

import { apiClient } from "@utils/apiClient";
import { devError, devLog, devWarn } from "@utils/logger";

import { DEFAULT_PAGINATION, ERROR_MESSAGES, POST_STATUS } from "@constants";
import type { Post } from "@types";

/** Shape the backend actually returns for the posts list endpoint */
interface PostsApiResponse {
  success: boolean;
  data?: Post[];
  pagination?: Pagination;
  error?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

interface PostsStats {
  total: number;
  published: number;
  drafts: number;
  withPlatforms: number;
}

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  stats: PostsStats;
  fetchPosts: (opts?: Partial<Pagination>) => Promise<void>;
  refreshPosts: () => void;
  addPost: (newPost: Post) => void;
  updatePost: (updatedPost: Partial<Post> & { id?: string; _id?: string }) => void;
  deletePost: (postId: string) => void;
  setPagination: React.Dispatch<React.SetStateAction<Pagination>>;
}

export function usePosts(initialPagination: Pagination = DEFAULT_PAGINATION): UsePostsReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (opts: Partial<Pagination> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = opts.page !== undefined || opts.limit !== undefined ? opts : { page: 1, limit: 20 };
      devLog("Fetching posts with params:", params);

      const response = (await apiClient.getPosts(params)) as unknown as PostsApiResponse;

      if (response && response.success) {
        devLog("Posts fetched:", response.data?.length ?? 0);
        setPosts(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
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
    fetchPosts();
  }, []); // Only run once on mount

  const addPost = useCallback((newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const updatePost = useCallback((updatedPost: Partial<Post> & { id?: string; _id?: string }) => {
    setPosts((prev) =>
      prev.map((post) => {
        const postId = post._id;
        const updatedId = updatedPost._id || updatedPost.id;
        return postId === updatedId ? { ...post, ...updatedPost } : post;
      }),
    );
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.filter((post) => {
        const currentId = post._id;
        return currentId !== postId;
      }),
    );
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

export default usePosts;
