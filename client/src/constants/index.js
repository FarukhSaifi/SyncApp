// Shared UI constants
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const PLATFORMS = Object.freeze({
  MEDIUM: "medium",
  DEVTO: "devto",
  WORDPRESS: "wordpress",
});

export const ROUTES = Object.freeze({
  DASHBOARD: "/",
  EDITOR: "/editor",
  SETTINGS: "/settings",
  PROFILE: "/profile",
  LOGIN: "/login",
  REGISTER: "/register",
});

export const UI_TEXT = Object.freeze({
  appName: "SyncApp",
});

// Pagination defaults
export const DEFAULT_PAGINATION = Object.freeze({
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
});

// Post status display config (unified across UI)
export const STATUS_CONFIG = Object.freeze({
  draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
  published: { label: "Published", className: "bg-green-100 text-green-800" },
  archived: { label: "Archived", className: "bg-yellow-100 text-yellow-800" },
});

// API base and paths
export const API_BASE = import.meta.env.VITE_API_BACKEND_URL || "/api";
export const API_PATHS = Object.freeze({
  AUTH: `${API_BASE}/auth`,
  POSTS: `${API_BASE}/posts`,
  CREDENTIALS: `${API_BASE}/credentials`,
  PUBLISH: `${API_BASE}/publish`,
  MDX: `${API_BASE}/mdx`,
});

// HTTP methods
export const HTTP_METHODS = Object.freeze({
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
});
