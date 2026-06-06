import { useCallback, useEffect, useState } from "react";

import { APP_CONFIG, ERRORS } from "@/src/constants";
import { apiClient } from "@/src/services/apiClient";
import type { Post } from "@/src/types";

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getPosts({ page: 1, limit: APP_CONFIG.POSTS_LIST_LIMIT });
      if (res.success && Array.isArray(res.data)) {
        setPosts(res.data);
      } else {
        setError(res.error ?? ERRORS.FAILED_TO_LOAD_POSTS);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const removePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => (p._id || p.id) !== id));
  }, []);

  return { posts, loading, error, fetchPosts, removePost };
}
