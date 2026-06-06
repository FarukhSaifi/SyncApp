export interface PlatformStatus {
  published: boolean;
  post_id?: string;
  url?: string;
  published_at?: string;
}

export interface Post {
  _id: string;
  id?: string;
  slug?: string;
  title: string;
  content_markdown: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  meta_description?: string;
  cover_image?: string;
  canonical_url?: string;
  scheduled_for?: string;
  platform_status?: {
    medium?: PlatformStatus;
    devto?: PlatformStatus;
    wordpress?: PlatformStatus;
  };
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  isVerified?: boolean;
  role: "user" | "admin";
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    pages?: number;
  };
}

export interface ListResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (userData: Record<string, unknown>) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Record<string, unknown>) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  isAuthenticated: boolean;
}

export interface AnalyticsStats {
  summary: {
    totalPosts: number;
    totalPublished: number;
    totalDrafts: number;
    publishRate: number;
  };
  platformStats: {
    medium: number;
    devto: number;
    wordpress: number;
  };
  history: Array<{ date: string; posts: number; published: number }>;
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, unknown>;
  timeout?: number;
}
