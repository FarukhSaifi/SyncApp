/**
 * Shared type definitions for SyncApp client.
 * Use these for API responses, props, and state.
 */

export interface PlatformStatus {
  published: boolean;
  post_id?: string;
  url?: string;
  published_at?: string;
}

export interface Post {
  _id: string;
  slug?: string;
  title: string;
  content_markdown: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  cover_image?: string;
  canonical_url?: string;
  author: UserRef | string;
  platform_status?: {
    medium?: PlatformStatus;
    devto?: PlatformStatus;
    wordpress?: PlatformStatus;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRef {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface User {
  _id: string;
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
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** List endpoint response: success, data array, and pagination at top level (e.g. GET /api/users) */
export interface ListResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

export interface Credential {
  _id: string;
  platform: string;
  user: string;
  api_key?: string;
  site_url?: string;
  platform_config?: Record<string, unknown>;
}

declare global {
  interface Window {
    __syncapp_env?: Record<string, unknown>;
  }
}
