/**
 * Centralized API client: single place for all backend calls.
 * Used by hooks (e.g. usePosts) and views; keeps auth, serialization, and error handling in one layer.
 * Typed with ApiResponse<T> and domain types from src/types.
 */

import { API_BASE, API_PATHS, APP_CONFIG, HTTP_METHODS, MDX_DOWNLOAD, STORAGE_KEYS } from "@constants";
import type { AnalyticsStats, ApiResponse, ListResponse, PaginatedResponse, Post, RequestOptions, User } from "@types";
import { coerceErrorMessage, extractApiErrorMessage } from "@utils/errorMessage";
import { devLog, logError } from "@utils/logger";
import axios, { type AxiosInstance } from "axios";
import qs from "qs";

class ApiClient {
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
        if (typeof window !== "undefined") {
          const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Remove Content-Type if sending FormData so browser can set boundary
        if (config.data instanceof FormData && config.headers) {
          delete config.headers["Content-Type"];
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
          const message = extractApiErrorMessage(
            error.response.data,
            error.response.status,
            error.response.statusText,
          );
          return Promise.reject(new Error(message));
        }
        if (error.request) {
          return Promise.reject(new Error("Network error: Unable to connect to server"));
        }
        return Promise.reject(new Error(coerceErrorMessage(error.message, "Request failed")));
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

  // Auth
  login(body: Record<string, unknown>): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request(`${API_PATHS.AUTH}/login`, {
      method: HTTP_METHODS.POST,
      body,
    });
  }

  register(body: Record<string, unknown>): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request(`${API_PATHS.AUTH}/register`, {
      method: HTTP_METHODS.POST,
      body,
    });
  }

  getMe(): Promise<ApiResponse<User>> {
    return this.request(`${API_PATHS.AUTH}/me`);
  }

  updateProfile(body: Record<string, unknown>): Promise<ApiResponse<User>> {
    return this.request(`${API_PATHS.AUTH}/me`, {
      method: HTTP_METHODS.PUT,
      body,
    });
  }

  changePassword(body: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.request(`${API_PATHS.AUTH}/change-password`, {
      method: HTTP_METHODS.PUT,
      body,
    });
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

  deleteCredential(platform: string): Promise<ApiResponse<unknown>> {
    return this.request(`${API_PATHS.CREDENTIALS}/${platform}`, {
      method: HTTP_METHODS.DELETE,
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

  /** Analytics */
  async getAnalyticsStats(): Promise<ApiResponse<AnalyticsStats>> {
    return this.request("/analytics/stats");
  }

  // MDX export
  async downloadMdx(postId: string): Promise<void> {
    const url = `${API_BASE}/mdx/${postId}`;
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
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
      if (typeof document === "undefined") throw new Error("Download is only supported in the browser");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  // AI
  aiGenerate(
    keyword: string,
    options: { model?: string; targetPlatforms?: string[] } = {},
  ): Promise<ApiResponse<{ title: string; meta_description: string; tags: string[]; content: string }>> {
    return this.request(`${API_PATHS.AI}/generate`, {
      method: HTTP_METHODS.POST,
      body: { keyword, ...options },
      timeout: APP_CONFIG.API_AI_TIMEOUT,
    });
  }

  aiGenerateImage(topic: string, additionalPrompt?: string): Promise<ApiResponse<{ imageDataUrl: string }>> {
    return this.request(`${API_PATHS.AI}/generate-image`, {
      method: HTTP_METHODS.POST,
      body: { topic, additionalPrompt },
      timeout: APP_CONFIG.API_AI_IMAGE_TIMEOUT,
    });
  }

  aiEdit(action: string, text: string): Promise<ApiResponse<{ result: string }>> {
    return this.request(`${API_PATHS.AI}/edit`, {
      method: HTTP_METHODS.POST,
      body: { action, text },
      timeout: APP_CONFIG.API_AI_TIMEOUT,
    });
  }

  aiOptimise(payload: {
    title?: string;
    meta_description?: string;
    tags?: string[];
    content_markdown: string;
  }): Promise<
    ApiResponse<{ title: string; meta_description: string; tags: string[]; content: string; canonical_url?: string }>
  > {
    return this.request(`${API_PATHS.AI}/optimise`, {
      method: HTTP_METHODS.POST,
      body: payload,
      timeout: APP_CONFIG.API_AI_TIMEOUT,
    });
  }

  uploadPostCover(postId: string, imageDataUrl: string): Promise<ApiResponse<{ url: string; post: unknown }>> {
    return this.request(`${API_PATHS.POSTS}/${postId}/cover`, {
      method: HTTP_METHODS.PUT,
      body: { image: imageDataUrl },
      timeout: APP_CONFIG.API_COVER_UPLOAD_TIMEOUT,
    });
  }

  uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append("image", file);
    return this.request(`${API_PATHS.UPLOAD}`, {
      method: HTTP_METHODS.POST,
      body: formData,
      headers: {
        // Axios will automatically set the correct Content-Type for FormData
        // but we ensure it doesn't default to application/json
      },
      timeout: APP_CONFIG.API_COVER_UPLOAD_TIMEOUT, // use same generous timeout
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
