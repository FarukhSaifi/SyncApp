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
