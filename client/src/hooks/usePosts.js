import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_PAGINATION, ERROR_MESSAGES, POST_STATUS } from "../constants";
import { apiClient } from "../utils/apiClient";
import { devError, devLog, devWarn } from "../utils/logger";

export function usePosts(initialPagination = DEFAULT_PAGINATION) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(initialPagination);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = opts.page !== undefined || opts.limit !== undefined ? opts : { page: 1, limit: 20 };
      devLog("Fetching posts with params:", params);

      const response = await apiClient.getPosts(params);

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
      setError(err?.message || ERROR_MESSAGES.FAILED_TO_FETCH_POSTS);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []); // Only run once on mount

  const addPost = useCallback((newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const updatePost = useCallback((updatedPost) => {
    setPosts((prev) =>
      prev.map((post) => {
        const postId = post.id || post._id;
        const updatedId = updatedPost.id || updatedPost._id;
        return postId === updatedId ? { ...post, ...updatedPost } : post;
      }),
    );
  }, []);

  const deletePost = useCallback((postId) => {
    setPosts((prev) =>
      prev.filter((post) => {
        const currentId = post.id || post._id;
        return currentId !== postId;
      }),
    );
  }, []);

  const refreshPosts = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  const stats = useMemo(
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
