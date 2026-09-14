import React from "react";

import type { PostsStats } from "./analytics";
import type { Pagination } from "./api";
import type { Post, User } from "./models";

/**
 * Common application state, hook options, and global window typings.
 */

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UserDeleteConfirmState {
  isOpen: boolean;
  userId: string | null;
  username: string;
}

export interface DashboardProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  onPostUpdate: (post: Post) => void;
  onPostDelete: (id: string) => void;
  onRefresh: () => void;
}

export interface DashboardDeleteConfirmState {
  isOpen: boolean;
  postId: string | null;
}

export interface UsePostsReturn {
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

export interface UsePostsOptions {
  enabled?: boolean;
  pagination?: Pagination;
  userId?: string | null;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (userData: Record<string, unknown>) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (profileData: Record<string, unknown>) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
}

declare global {
  interface Window {
    __syncapp_env?: Record<string, unknown>;
  }
}
