"use client";

import LoadingScreen from "@components/common/LoadingScreen";
import { Toaster } from "@components/common/Toaster";
import ErrorBoundary from "@components/ErrorBoundary";
import Layout from "@components/Layout";
import { ROUTES, USER_ROLES } from "@constants";
import { INFO_MESSAGES } from "@constants/messages";
import { useAuth } from "@contexts/AuthContext";
import { usePosts } from "@hooks/usePosts";
import type { Post } from "@types";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <LoadingScreen message={INFO_MESSAGES.LOADING} />;
  return <>{children}</>;
}

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
  const postsState = usePosts({ enabled: isAuthenticated });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    // Admin-only route
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
          <ClientOnly>
            {children}
            <Toaster />
          </ClientOnly>
        </ErrorBoundary>
      </Layout>
    </PostsContext.Provider>
  );
}
