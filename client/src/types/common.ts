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
  page: number;
  pages: number;
  pageSize?: number;
  totalPosts?: number;
  /** Count for the current list query (status/search + pagination). */
  filteredTotal?: number;
  stats?: PostsStats;
  onPostDelete: (id: string) => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
  onStatusFilterChange?: (status: string) => void;
  onSearchChange?: (search: string) => void;
}

export interface DashboardDeleteConfirmState {
  isOpen: boolean;
  postId: string | null;
}

export interface PostsListFilters {
  status?: string;
  search?: string;
}

export interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  stats: PostsStats;
  totalPages: number;
  goToPage: (page: number) => Promise<void>;
  resetAndFetch: (opts?: Partial<Pagination> & PostsListFilters) => Promise<void>;
  refreshPosts: () => void;
  addPost: (newPost: Post) => void;
  updatePost: (updatedPost: Partial<Post> & { id?: string; _id?: string }) => void;
  deletePost: (postId: string) => void;
}

export interface UsePostsOptions {
  enabled?: boolean;
  pagination?: Pagination;
  userId?: string | null;
}

export interface PostsContextValue {
  posts: Post[];
  loading: boolean;
  error: string | null;
  page: number;
  pages: number;
  pageSize: number;
  totalPosts: number;
  filteredTotal: number;
  stats: PostsStats;
  onPostUpdate: (post: Post) => void;
  onPostDelete: (id: string) => void;
  onRefresh: () => void;
  onPostCreate: (post: Post) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onStatusFilterChange: (status: string) => void;
  onSearchChange: (search: string) => void;
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
