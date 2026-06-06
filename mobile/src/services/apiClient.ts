import { API_BASE, HTTP_METHODS } from "@/src/constants/api";
import { APP_CONFIG } from "@/src/constants/config";
import type { AnalyticsStats, ApiResponse, ListResponse, Post, RequestOptions, User } from "@/src/types";
import axios, { type AxiosInstance } from "axios";
import qs from "qs";

import { clearToken, getToken } from "./tokenStorage";

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma", skipNulls: true }),
      timeout: APP_CONFIG.API_TIMEOUT,
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (config.data instanceof FormData && config.headers) {
        delete config.headers["Content-Type"];
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        if (error.response?.status === 401) {
          await clearToken();
          onUnauthorized?.();
        }
        const message =
          error.response?.data?.error || error.response?.data?.message || error.message || "Request failed";
        return Promise.reject(new Error(message));
      },
    );
  }

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = HTTP_METHODS.GET, headers = {}, body, params, timeout } = options;
    const urlPath = path.startsWith(API_BASE) ? path.slice(API_BASE.length) : path;
    return this.client.request({
      url: urlPath,
      method,
      headers,
      data: body,
      params,
      ...(timeout != null && { timeout }),
    }) as Promise<T>;
  }

  login(body: Record<string, unknown>): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request(`${API_BASE}/auth/login`, { method: HTTP_METHODS.POST, body });
  }

  register(body: Record<string, unknown>): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request(`${API_BASE}/auth/register`, { method: HTTP_METHODS.POST, body });
  }

  getMe(): Promise<ApiResponse<User>> {
    return this.request(`${API_BASE}/auth/me`);
  }

  updateProfile(body: Record<string, unknown>): Promise<ApiResponse<User>> {
    return this.request(`${API_BASE}/auth/me`, { method: HTTP_METHODS.PUT, body });
  }

  changePassword(body: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.request(`${API_BASE}/auth/change-password`, { method: HTTP_METHODS.PUT, body });
  }

  getPosts(params: Record<string, unknown> = {}): Promise<ApiResponse<Post[]>> {
    return this.request(`${API_BASE}/posts`, { params });
  }

  getPost(id: string): Promise<ApiResponse<Post>> {
    return this.request(`${API_BASE}/posts/${id}`);
  }

  createPost(body: Record<string, unknown>): Promise<ApiResponse<Post>> {
    return this.request(`${API_BASE}/posts`, { method: HTTP_METHODS.POST, body });
  }

  updatePost(id: string, body: Record<string, unknown>): Promise<ApiResponse<Post>> {
    return this.request(`${API_BASE}/posts/${id}`, { method: HTTP_METHODS.PUT, body });
  }

  deletePost(id: string): Promise<ApiResponse<unknown>> {
    return this.request(`${API_BASE}/posts/${id}`, { method: HTTP_METHODS.DELETE });
  }

  getCredentials(): Promise<ApiResponse<unknown[]>> {
    return this.request(`${API_BASE}/credentials`);
  }

  getCredential(platform: string): Promise<ApiResponse<unknown>> {
    return this.request(`${API_BASE}/credentials/${platform}`);
  }

  upsertCredential(platform: string, body: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.request(`${API_BASE}/credentials/${platform}`, { method: HTTP_METHODS.PUT, body });
  }

  publish(platform: string, postId: string): Promise<ApiResponse<unknown>> {
    return this.request(`${API_BASE}/publish/${platform}`, {
      method: HTTP_METHODS.POST,
      body: { postId },
    });
  }

  publishAll(postId: string): Promise<ApiResponse<unknown>> {
    return this.request(`${API_BASE}/publish/all`, {
      method: HTTP_METHODS.POST,
      body: { postId },
    });
  }

  getAnalyticsStats(): Promise<ApiResponse<AnalyticsStats>> {
    return this.request(`${API_BASE}/analytics/stats`);
  }

  aiGenerate(
    keyword: string,
  ): Promise<ApiResponse<{ title: string; meta_description: string; tags: string[]; content: string }>> {
    return this.request(`${API_BASE}/ai/generate`, {
      method: HTTP_METHODS.POST,
      body: { keyword },
      timeout: APP_CONFIG.API_AI_TIMEOUT,
    });
  }

  aiGenerateImage(topic: string, additionalPrompt?: string): Promise<ApiResponse<{ imageDataUrl: string }>> {
    return this.request(`${API_BASE}/ai/generate-image`, {
      method: HTTP_METHODS.POST,
      body: { topic, additionalPrompt },
      timeout: APP_CONFIG.API_AI_IMAGE_TIMEOUT,
    });
  }

  aiEdit(action: string, text: string): Promise<ApiResponse<{ result: string }>> {
    return this.request(`${API_BASE}/ai/edit`, {
      method: HTTP_METHODS.POST,
      body: { action, text },
      timeout: APP_CONFIG.API_AI_TIMEOUT,
    });
  }

  uploadPostCover(postId: string, imageDataUrl: string): Promise<ApiResponse<{ url: string }>> {
    return this.request(`${API_BASE}/posts/${postId}/cover`, {
      method: HTTP_METHODS.PUT,
      body: { image: imageDataUrl },
      timeout: APP_CONFIG.API_COVER_UPLOAD_TIMEOUT,
    });
  }

  uploadImage(uri: string, filename: string, mimeType: string): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append("image", { uri, name: filename, type: mimeType } as unknown as Blob);
    return this.request(`${API_BASE}/upload`, {
      method: HTTP_METHODS.POST,
      body: formData,
      timeout: APP_CONFIG.API_COVER_UPLOAD_TIMEOUT,
    });
  }

  getUsers(params: Record<string, unknown> = {}): Promise<ListResponse<User>> {
    return this.request(`${API_BASE}/users`, { params });
  }

  createUser(body: Record<string, unknown>): Promise<ApiResponse<User>> {
    return this.request(`${API_BASE}/users`, { method: HTTP_METHODS.POST, body });
  }

  updateUser(id: string, body: Record<string, unknown>): Promise<ApiResponse<User>> {
    return this.request(`${API_BASE}/users/${id}`, { method: HTTP_METHODS.PUT, body });
  }

  deleteUser(id: string): Promise<ApiResponse<User>> {
    return this.request(`${API_BASE}/users/${id}`, { method: HTTP_METHODS.DELETE });
  }
}

export const apiClient = new ApiClient();
