/**
 * Centralized API client using axios with auth, query building, and robust error handling.
 * Typed with ApiResponse<T> and domain types from src/types.
 */
import axios, { type AxiosInstance } from "axios";
import qs from "qs";

import { API_BASE, API_PATHS, APP_CONFIG, HTTP_METHODS, MDX_DOWNLOAD, STORAGE_KEYS } from "@constants";
import type { ApiResponse, ListResponse, PaginatedResponse, Post, User } from "@types";
import { devLog, logError } from "@utils/logger";

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | FormData;
  params?: Record<string, unknown>;
  timeout?: number;
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma", skipNulls: true }),
      withCredentials: false,
      timeout: APP_CONFIG.API_TIMEOUT,
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => {
        devLog(`API ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        return response.data;
      },
      (error) => {
        logError(`API ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error);
        if (error.response) {
          const message =
            error.response.data?.error ||
            error.response.data?.message ||
            `HTTP ${error.response.status}: ${error.response.statusText}`;
          return Promise.reject(new Error(message));
        }
        if (error.request) {
          return Promise.reject(new Error("Network error: Unable to connect to server"));
        }
        return Promise.reject(new Error(error.message || "Request failed"));
      },
    );
  }

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = HTTP_METHODS.GET, headers = {}, body, params, timeout } = options;
    const urlPath = path.startsWith(API_BASE) ? path.slice(API_BASE.length) : path;
    const response = await this.client.request({
      url: urlPath,
      method,
      headers,
      data: body instanceof FormData ? body : body,
      params,
      ...(timeout != null && { timeout }),
    });
    return response as T;
  }

  // Posts
  getPosts(params: Record<string, unknown> = {}): Promise<ApiResponse<PaginatedResponse<Post>>> {
    return this.request(`${API_PATHS.POSTS}`, { params });
  }

  getPost(id: string): Promise<ApiResponse<Post>> {
    return this.request(`${API_PATHS.POSTS}/${id}`);
  }

  getPostBySlug(slug: string): Promise<ApiResponse<Post>> {
    return this.request(`${API_PATHS.POSTS}/slug/${encodeURIComponent(slug)}`);
  }

  createPost(body: Record<string, unknown>): Promise<ApiResponse<Post>> {
    return this.request(`${API_PATHS.POSTS}`, {
      method: HTTP_METHODS.POST,
      body,
    });
  }

  updatePost(id: string, body: Record<string, unknown>): Promise<ApiResponse<Post>> {
    return this.request(`${API_PATHS.POSTS}/${id}`, {
      method: HTTP_METHODS.PUT,
      body,
    });
  }

  deletePost(id: string): Promise<ApiResponse<unknown>> {
    return this.request(`${API_PATHS.POSTS}/${id}`, {
      method: HTTP_METHODS.DELETE,
    });
  }

  // Credentials
  upsertCredential(platform: string, body: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.request(`${API_PATHS.CREDENTIALS}/${platform}`, {
      method: HTTP_METHODS.PUT,
      body,
    });
  }

  // Publish
  publish(platform: string, postId: string): Promise<ApiResponse<Post>> {
    return this.request(`${API_PATHS.PUBLISH}/${platform}`, {
      method: HTTP_METHODS.POST,
      body: { postId },
    });
  }

  publishAll(postId: string): Promise<ApiResponse<Post>> {
    return this.request(`${API_PATHS.PUBLISH}/all`, {
      method: HTTP_METHODS.POST,
      body: { postId },
    });
  }

  unpublishFromPlatform(
    platform: string,
    postId: string,
  ): Promise<ApiResponse<{ platformStatus: Record<string, unknown> }>> {
    return this.request(`${API_PATHS.PUBLISH}/${platform}/${postId}`, {
      method: HTTP_METHODS.DELETE,
    });
  }

  // MDX export
  async downloadMdx(postId: string): Promise<void> {
    const url = `${API_BASE}/mdx/${postId}`;
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error(MDX_DOWNLOAD.FAILED_MESSAGE);
    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    let filename = `${MDX_DOWNLOAD.FILENAME_PREFIX}${postId}${MDX_DOWNLOAD.FILENAME_EXT}`;
    const match = disposition.match(/filename\*=UTF-8''([^;\n]*)|filename="?([^";\n]*)"?/i);
    if (match) {
      filename = decodeURIComponent(match[1] || match[2] || filename);
    }
    try {
      const { saveAs } = await import("file-saver");
      saveAs(blob, filename);
    } catch {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  // AI
  aiOutline(keyword: string): Promise<ApiResponse<{ outline: string }>> {
    return this.request(`${API_PATHS.AI}/outline`, {
      method: HTTP_METHODS.POST,
      body: { keyword },
      timeout: APP_CONFIG.API_AI_TIMEOUT,
    });
  }

  aiDraft(outline: string): Promise<ApiResponse<{ draft: string }>> {
    return this.request(`${API_PATHS.AI}/draft`, {
      method: HTTP_METHODS.POST,
      body: { outline },
      timeout: APP_CONFIG.API_AI_TIMEOUT,
    });
  }

  aiGenerate(
    keyword: string,
    options: Record<string, unknown> = {},
  ): Promise<ApiResponse<{ outline: string; draft: string; content: string }>> {
    return this.request(`${API_PATHS.AI}/generate`, {
      method: HTTP_METHODS.POST,
      body: { keyword, ...options },
      timeout: APP_CONFIG.API_AI_TIMEOUT,
    });
  }

  aiGenerateImage(outline: string): Promise<ApiResponse<{ imageDataUrl: string }>> {
    return this.request(`${API_PATHS.AI}/generate-image`, {
      method: HTTP_METHODS.POST,
      body: { outline },
      timeout: 65_000,
    });
  }

  uploadPostCover(postId: string, imageDataUrl: string): Promise<ApiResponse<{ url: string; post: unknown }>> {
    return this.request(`${API_PATHS.POSTS}/${postId}/cover`, {
      method: HTTP_METHODS.PUT,
      body: { image: imageDataUrl },
      timeout: 30_000,
    });
  }

  // Users (Admin only)
  getUsers(params: Record<string, unknown> = {}): Promise<ListResponse<User>> {
    return this.request(`${API_PATHS.USERS}`, { params });
  }

  getUser(id: string): Promise<ApiResponse<unknown>> {
    return this.request(`${API_PATHS.USERS}/${id}`);
  }

  createUser(body: Record<string, unknown>): Promise<ApiResponse<User>> {
    return this.request(`${API_PATHS.USERS}`, {
      method: HTTP_METHODS.POST,
      body,
    });
  }

  updateUser(id: string, body: Record<string, unknown>): Promise<ApiResponse<User>> {
    return this.request(`${API_PATHS.USERS}/${id}`, {
      method: HTTP_METHODS.PUT,
      body,
    });
  }

  deleteUser(id: string): Promise<ApiResponse<User>> {
    return this.request(`${API_PATHS.USERS}/${id}`, {
      method: HTTP_METHODS.DELETE,
    });
  }
}

export const apiClient = new ApiClient();
