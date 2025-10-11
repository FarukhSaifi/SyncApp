import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_PAGINATION } from "../constants";
import { apiClient } from "../utils/apiClient";

export function usePosts(initialPagination = DEFAULT_PAGINATION) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(initialPagination);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Use opts if provided, otherwise use current pagination state
      const params = opts.page !== undefined || opts.limit !== undefined ? opts : { page: 1, limit: 20 };

      console.log("🔄 Fetching posts with params:", params);
      const response = await apiClient.getPosts(params);

      if (response && response.success) {
        console.log("✅ Posts fetched successfully:", response.data?.length || 0, "posts");
        setPosts(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        console.warn("⚠️ API returned unsuccessful response:", response);
        setError(response?.error || "Failed to fetch posts");
        setPosts([]);
      }
    } catch (err) {
      console.error("❌ Error fetching posts:", err);
      setError(err.message || "Failed to fetch posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to prevent infinite loops

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
      })
    );
  }, []);

  const deletePost = useCallback((postId) => {
    setPosts((prev) =>
      prev.filter((post) => {
        const currentId = post.id || post._id;
        return currentId !== postId;
      })
    );
  }, []);

  const refreshPosts = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  const stats = useMemo(
    () => ({
      total: posts.length,
      published: posts.filter((p) => p.status === "published").length,
      drafts: posts.filter((p) => p.status === "draft").length,
      withPlatforms: posts.filter(
        (p) =>
          p.platform_status &&
          (p.platform_status.medium?.published ||
            p.platform_status.devto?.published ||
            p.platform_status.wordpress?.published)
      ).length,
    }),
    [posts]
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
