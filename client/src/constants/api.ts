/**
 * API base URL and path segments — single source for client HTTP calls.
 */

const getApiBase = (): string => {
  if (typeof window === "undefined") {
    const isProd = process.env.NODE_ENV === "production";
    const envUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL;
    const base = envUrl || (isProd ? "https://sync-app-server.vercel.app" : "http://localhost:9000");
    return base.endsWith("/api") ? base : `${base}/api`;
  }
  return "/api";
};

export const API_BASE = getApiBase();

export const API_PATHS = Object.freeze({
  AUTH: `${API_BASE}/auth`,
  POSTS: `${API_BASE}/posts`,
  CREDENTIALS: `${API_BASE}/credentials`,
  PUBLISH: `${API_BASE}/publish`,
  MDX: `${API_BASE}/mdx`,
  USERS: `${API_BASE}/users`,
  AI: `${API_BASE}/ai`,
  UPLOAD: `${API_BASE}/upload`,
  ANALYTICS: `${API_BASE}/analytics`,
} as const);

export const HTTP_METHODS = Object.freeze({
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const);

/**
 * Public-facing base URL of the blog where posts are readable.
 * Set NEXT_PUBLIC_CANONICAL_BASE_URL in .env to enable full canonical URLs.
 */
export const CANONICAL_BASE_URL: string =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CANONICAL_BASE_URL?.trim()) || "";
