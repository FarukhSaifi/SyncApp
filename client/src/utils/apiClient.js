// Centralized API client using axios with auth, query building, and robust error handling
import axios from "axios";
import qs from "qs";
import { API_BASE, API_PATHS, HTTP_METHODS } from "../constants";

export class ApiClient {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: { "Content-Type": "application/json" },
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma", skipNulls: true }),
      withCredentials: false,
      timeout: 10000, // 10 second timeout
    });

    // Attach token to every request
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Normalize responses and errors
    this.client.interceptors.response.use(
      (response) => {
        // Log successful requests in development
        if (import.meta.env.DEV || import.meta.env.MODE === "development") {
          console.log(`✅ API ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response.data;
      },
      (error) => {
        // Log errors in development
        if (import.meta.env.DEV || import.meta.env.MODE === "development") {
          console.error(
            `❌ API ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
            error.response?.data || error.message
          );
        }

        // Handle different error types
        if (error.response) {
          // Server responded with error status
          const message =
            error.response.data?.error ||
            error.response.data?.message ||
            `HTTP ${error.response.status}: ${error.response.statusText}`;
          return Promise.reject(new Error(message));
        } else if (error.request) {
          // Request was made but no response received
          return Promise.reject(new Error("Network error: Unable to connect to server"));
        } else {
          // Something else happened
          return Promise.reject(new Error(error.message || "Request failed"));
        }
      }
    );
  }

  async request(path, { method = "GET", headers = {}, body, params } = {}) {
    const urlPath = path.startsWith(API_BASE) ? path.slice(API_BASE.length) : path;
    const response = await this.client.request({
      url: urlPath,
      method,
      headers,
      data: body instanceof FormData ? body : body,
      params,
    });
    return response;
  }

  // Posts
  getPosts(params = {}) {
    return this.request(`${API_PATHS.POSTS}`, { params });
  }

  getPost(id) {
    return this.request(`${API_PATHS.POSTS}/${id}`);
  }

  getPostBySlug(slug) {
    return this.request(`${API_PATHS.POSTS}/slug/${encodeURIComponent(slug)}`);
  }

  createPost(body) {
    return this.request(`${API_PATHS.POSTS}`, { method: HTTP_METHODS.POST, body });
  }

  updatePost(id, body) {
    return this.request(`${API_PATHS.POSTS}/${id}`, { method: HTTP_METHODS.PUT, body });
  }

  deletePost(id) {
    return this.request(`${API_PATHS.POSTS}/${id}`, { method: HTTP_METHODS.DELETE });
  }

  // Credentials
  upsertCredential(platform, body) {
    return this.request(`${API_PATHS.CREDENTIALS}/${platform}`, { method: HTTP_METHODS.PUT, body });
  }

  // Publish
  publish(platform, postId) {
    return this.request(`${API_PATHS.PUBLISH}/${platform}`, { method: HTTP_METHODS.POST, body: { postId } });
  }
  publishAll(postId) {
    return this.request(`${API_PATHS.PUBLISH}/all`, { method: HTTP_METHODS.POST, body: { postId } });
  }
  unpublishFromPlatform(platform, postId) {
    return this.request(`${API_PATHS.PUBLISH}/${platform}/${postId}`, { method: HTTP_METHODS.DELETE });
  }

  // MDX export
  async downloadMdx(postId) {
    // Use full URL with API_BASE for fetch (which doesn't use axios baseURL)
    const url = `${API_BASE}/mdx/${postId}`;
    const token = localStorage.getItem("token");
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error("Failed to download MDX");
    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    let filename = `post-${postId}.mdx`;
    const match = disposition.match(/filename\*=UTF-8''([^;\n]*)|filename="?([^";\n]*)"?/i);
    if (match) {
      filename = decodeURIComponent(match[1] || match[2] || filename);
    }
    try {
      // Prefer FileSaver when available
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
}

export const apiClient = new ApiClient();
