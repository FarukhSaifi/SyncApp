import type { Post } from "./models";

/**
 * Generic and specific API request/response types for client communication.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
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

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | FormData;
  params?: Record<string, unknown>;
  timeout?: number;
}

export interface PostsApiResponse {
  success: boolean;
  data?: Post[];
  pagination?: Pagination;
  error?: string;
}
