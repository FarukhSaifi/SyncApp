"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

import ErrorBoundary from "@components/ErrorBoundary";
import Layout from "@components/Layout";
import { ROUTES, USER_ROLES, routeNeedsPosts } from "@constants";
import { useAuth } from "@contexts/AuthContext";
import { usePosts } from "@hooks/usePosts";
import type { Post } from "@types";
import { usePathname, useRouter } from "next/navigation";

import { INFO_MESSAGES } from "@constants/messages";

import ClientOnly from "@components/common/ClientOnly";
import LoadingScreen from "@components/common/LoadingScreen";

interface PostsContextValue {
  posts: Post[];
  loading: boolean;
  error: string | null;
  onPostUpdate: (post: Post) => void;
  onPostDelete: (id: string) => void;
  onRefresh: () => void;
  onPostCreate: (post: Post) => void;
}

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
  const postsState = usePosts({
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

  if (authLoading) {
    return <LoadingScreen message={INFO_MESSAGES.LOADING} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const postsValue: PostsContextValue = {
    posts: postsState.posts,
    loading: postsState.loading,
    error: postsState.error,
    onPostUpdate: postsState.updatePost,
    onPostDelete: postsState.deletePost,
    onRefresh: postsState.refreshPosts,
    onPostCreate: postsState.addPost,
  };

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
