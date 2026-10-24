"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";

import ErrorBoundary from "@components/ErrorBoundary";
import Layout from "@components/Layout";
import { ROUTES, USER_ROLES, routeNeedsPosts } from "@constants";
import { useAuth } from "@contexts/AuthContext";
import { usePosts } from "@hooks/usePosts";
import type { PostsContextValue } from "@types";
import { usePathname, useRouter } from "next/navigation";

import { INFO_MESSAGES } from "@constants/messages";

import ClientOnly from "@components/common/ClientOnly";
import LoadingScreen from "@components/common/LoadingScreen";

const PostsContext = createContext<PostsContextValue | undefined>(undefined);

export function usePostsContext(): PostsContextValue {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePostsContext must be used within dashboard layout");
  return ctx;
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const needsPosts = routeNeedsPosts(pathname);
  const {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    pagination,
    totalPages,
    stats,
    goToPage,
    resetAndFetch,
    loadMore,
    updatePost,
    deletePost,
    refreshPosts,
    addPost,
  } = usePosts({
    enabled: isAuthenticated && needsPosts,
    userId: user?._id ?? null,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (pathname === ROUTES.USERS && user?.role !== USER_ROLES.ADMIN) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [authLoading, isAuthenticated, pathname, user?.role, router]);

  const onPageChange = useCallback(
    (nextPage: number) => {
      void goToPage(nextPage);
    },
    [goToPage],
  );

  const onPageSizeChange = useCallback(
    (limit: number) => {
      void resetAndFetch({ page: 1, limit });
    },
    [resetAndFetch],
  );

  const onStatusFilterChange = useCallback(
    (status: string) => {
      void resetAndFetch({ page: 1, status });
    },
    [resetAndFetch],
  );

  const onSearchChange = useCallback(
    (search: string) => {
      void resetAndFetch({ page: 1, search });
    },
    [resetAndFetch],
  );

  const onLoadMore = useCallback(() => {
    void loadMore();
  }, [loadMore]);

  const postsValue = useMemo<PostsContextValue>(
    () => ({
      posts,
      loading,
      loadingMore,
      error,
      hasMore,
      page: pagination.page,
      pages: totalPages,
      pageSize: pagination.limit,
      totalPosts: stats.total,
      filteredTotal: pagination.total ?? posts.length,
      stats,
      onPostUpdate: updatePost,
      onPostDelete: deletePost,
      onRefresh: refreshPosts,
      onPostCreate: addPost,
      onLoadMore,
      onPageChange,
      onPageSizeChange,
      onStatusFilterChange,
      onSearchChange,
    }),
    [
      posts,
      loading,
      loadingMore,
      error,
      hasMore,
      pagination.page,
      pagination.limit,
      pagination.total,
      totalPages,
      stats,
      updatePost,
      deletePost,
      refreshPosts,
      addPost,
      onLoadMore,
      onPageChange,
      onPageSizeChange,
      onStatusFilterChange,
      onSearchChange,
    ],
  );

  if (authLoading) {
    return <LoadingScreen message={INFO_MESSAGES.LOADING} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PostsContext.Provider value={postsValue}>
      <Layout>
        <ErrorBoundary>
          <ClientOnly>{children}</ClientOnly>
        </ErrorBoundary>
      </Layout>
    </PostsContext.Provider>
  );
}
