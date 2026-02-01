/**
 * Application Configuration Constants
 */

export const APP_CONFIG = Object.freeze({
  // App Info
  APP_NAME: "SyncApp",
  APP_DESCRIPTION: "Blog syndication made simple",
  COPYRIGHT: "© 2025 SyncApp. All rights reserved.",

  // API
  API_TIMEOUT: 10000, // 10 seconds
  API_AI_TIMEOUT: 60000, // 60 seconds for AI (outline/draft/comedian can be slow, especially with grounding)
  REQUEST_TIMEOUT: 10000,

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,

  // Toaster
  TOAST_MIN_WIDTH: "320px",
  TOAST_MAX_WIDTH: "480px",
  TOAST_AUTO_CLOSE_DELAY: 100, // ms

  // Cache
  CACHE_TTL_SHORT: 120000, // 2 minutes
  CACHE_TTL_MEDIUM: 300000, // 5 minutes
  CACHE_TTL_LONG: 600000, // 10 minutes
});

export const EXTERNAL_LINKS = Object.freeze({
  MEDIUM_SETTINGS: "https://medium.com/me/settings",
  DEVTO_SETTINGS: "https://dev.to/settings/account",
  WORDPRESS_JWT_PLUGIN: "https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/",
  GITHUB_REPO: "https://github.com/your-repo/syncapp",
});

export const ROLE_CONFIG = Object.freeze({
  admin: {
    label: "Admin",
    className: "bg-accent/15 text-accent",
  },
  user: {
    label: "User",
    className: "bg-muted text-muted-foreground",
  },
});

export const VERIFIED_CONFIG = Object.freeze({
  verified: {
    label: "Verified",
    className: "bg-positive/15 text-positive",
  },
  unverified: {
    label: "Unverified",
    className: "bg-warning/15 text-warning",
  },
});
