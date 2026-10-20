/**
 * API base URL and path segments — single source for client HTTP calls.
 */

import { API_ORIGINS, PROXY_API_BASE, resolveApiBase } from "./env";

export { API_ORIGINS, resolveApiOrigin, resolveSiteOrigin } from "./env";

export const API_BASE = resolveApiBase();

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
  LINKEDIN: `${API_BASE}/linkedin`,
  LINKEDIN_OAUTH_STATUS: `${API_BASE}/linkedin/oauth/status`,
  LINKEDIN_OAUTH_CALLBACK: `${API_BASE}/linkedin/oauth/callback`,
} as const);

/** Fallback redirect URI shown in Settings before oauth/status loads (dev). */
export const LINKEDIN_OAUTH_CALLBACK_FALLBACK =
  `${API_ORIGINS.DEVELOPMENT}${PROXY_API_BASE}/linkedin/oauth/callback` as const;

/**
 * Align with server API_URLS.LINKEDIN.SETTINGS_QUERY — OAuth return query on Settings.
 */
export const LINKEDIN_OAUTH_QUERY = Object.freeze({
  CONNECTED_KEY: "linkedin",
  CONNECTED_VALUE: "connected",
  ERROR_KEY: "linkedin_error",
} as const);

export const HTTP_METHODS = Object.freeze({
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const);

export const HTTP_CONTENT_TYPES = Object.freeze({
  JSON: "application/json",
  OCTET_STREAM: "application/octet-stream",
} as const);

export const URL_SCHEME_PREFIXES = Object.freeze({
  HTTP: "http://",
  HTTPS: "https://",
} as const);

/**
 * Public-facing base URL of the blog where posts are readable.
 * Set NEXT_PUBLIC_CANONICAL_BASE_URL in .env to enable full canonical URLs.
 */
export const CANONICAL_BASE_URL: string =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CANONICAL_BASE_URL?.trim()) || "";
