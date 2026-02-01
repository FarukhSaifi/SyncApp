// Re-export user roles, messages, and storage keys
export * from "./colorClasses";
export * from "./config";
export * from "./designTokens";
export * from "./editor";
export * from "./messages";
export * from "./userRoles";

// Re-export message types for easier access (explicit exports for better IDE support)
// Note: All exports are also available via "export * from './messages'" above
export {
  // Individual Message Types
  BUTTON_LABELS,
  ERROR_MESSAGES,
  INFO_MESSAGES,
  LABELS,
  MODAL_DESCRIPTIONS,
  MODAL_TITLES,
  PAGE_DESCRIPTIONS,
  PAGE_TITLES,
  SERVER_ERROR_MESSAGES,
  SERVER_MESSAGES,
  SERVER_SUCCESS_MESSAGES,
  SUCCESS_MESSAGES,
  SYNC_LABEL,
  TOAST_TITLES,
  UI_BUTTONS,
  UI_DESCRIPTIONS,
  // Grouped UI Exports (Recommended for new code)
  UI_LABELS,
  UI_MESSAGES,
  UI_PLACEHOLDERS,
  UI_TITLES,
  VALIDATION_MESSAGES,
  WARNING_MESSAGES,
} from "./messages";

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
  USERS: "/users",
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

// Post status display config (Get UI–inspired semantic colors)
export const STATUS_CONFIG = Object.freeze({
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  published: { label: "Published", className: "bg-positive/15 text-positive" },
  archived: { label: "Archived", className: "bg-warning/15 text-warning" },
});

// API base and paths
// In development, Vite proxy handles /api, so we use relative path
// In production, VITE_API_BACKEND_URL should be set to full backend URL (e.g., https://api.example.com/api)
const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_BACKEND_URL;
  if (envUrl) {
    // If full URL is provided, use it as-is
    return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
  }
  // Default to relative path for Vite proxy in development
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
});

// HTTP methods
export const HTTP_METHODS = Object.freeze({
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
});

/**
 * Local storage keys – single source of truth for client persistence.
 * Use these constants instead of string literals to avoid typos and simplify refactors.
 */
export const STORAGE_KEYS = Object.freeze({
  AUTH_TOKEN: "token",
});
