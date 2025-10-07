import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_PAGINATION } from "../constants";
import { apiClient } from "../utils/apiClient";

export function usePosts(initialPagination = DEFAULT_PAGINATION) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(initialPagination);
  const [error, setError] = useState("");

  const fetchPosts = useCallback(
    async (opts) => {
      const params = { ...(opts || pagination) };
      setLoading(true);
      setError("");
      try {
        const data = await apiClient.getPosts(params);
        if (data.success) {
          // API service returns { success, data, pagination }
          setPosts(data.data);
          if (data.pagination) setPagination(data.pagination);
        }
      } catch (e) {
        setError(e.message || "Failed to fetch posts");
      } finally {
        setLoading(false);
      }
    },
    [pagination]
  );

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPost = useCallback((newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const updatePost = useCallback((updatedPost) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id || post._id === updatedPost._id ? updatedPost : post))
    );
  }, []);

  const deletePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId && post._id !== postId));
  }, []);

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
    addPost,
    updatePost,
    deletePost,
    setPagination,
  };
}

export default usePosts;
