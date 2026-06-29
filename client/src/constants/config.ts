import { LABELS } from "./messages";

/**
 * Application Configuration Constants
 */

export const APP_CONFIG = Object.freeze({
  // Environment
  NODE_ENV_PRODUCTION: "production",
  NODE_ENV_DEVELOPMENT: "development",

  // App Info
  APP_NAME: "SyncApp",
  APP_DESCRIPTION: "Blog syndication made simple",
  COPYRIGHT: "© 2025 SyncApp. All rights reserved.",

  // API
  API_TIMEOUT: 60000, // 1 minute for API timeout
  API_AI_TIMEOUT: 60000, // 1 minute for AI (outline/draft can be slow, especially with grounding)
  API_AI_IMAGE_TIMEOUT: 120000, // 2 minutes for AI image generation
  API_COVER_UPLOAD_TIMEOUT: 60000, // 1 minute for cover image upload

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,

  // Toaster
  TOAST_MIN_WIDTH: "320px",
  TOAST_MAX_WIDTH: "480px",
  TOAST_AUTO_CLOSE_DELAY: 3000, // ms — default toast visibility

  // Post list display
  TAGS_DISPLAY_LIMIT_CARD: 5,
  TAGS_DISPLAY_LIMIT_ROW: 3,

  // Toast / UI timing
  SAVED_TOAST_DURATION_MS: 3000,

  // Validation (min lengths)
  VALIDATION_MIN_PASSWORD: 6,
  VALIDATION_MIN_USERNAME: 3,

  // Search
  SEARCH_DEBOUNCE_MS: 300,

  // Date Format
  DATE_FORMAT: "DD-MM-YYYY",
  DATE_FORMAT_WITH_TIME: "DD-MM-YYYY hh:mm A",
} as const);

export const EXTERNAL_LINKS = Object.freeze({
  MEDIUM_SETTINGS: "https://medium.com/me/settings",
  DEVTO_SETTINGS: "https://dev.to/settings/account",
  WORDPRESS_JWT_PLUGIN: "https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/",
  GITHUB_REPO: "https://github.com/FarukhSaifi/syncapp",
} as const);

export const ROLE_CONFIG = Object.freeze({
  admin: {
    label: "Admin",
    className: "bg-accent/15 text-accent",
  },
  user: {
    label: "User",
    className: "bg-muted text-muted-foreground",
  },
} as const);

export const VERIFIED_CONFIG = Object.freeze({
  verified: {
    label: "Verified",
    className: "bg-positive/15 text-positive",
  },
  unverified: {
    label: "Unverified",
    className: "bg-warning/15 text-warning",
  },
} as const);

export const CONNECTION_STATUS_CONFIG = Object.freeze({
  active: {
    label: LABELS.ACTIVE,
    className: "bg-positive/15 text-positive",
  },
  inactive: {
    label: LABELS.INACTIVE,
    className: "bg-muted text-muted-foreground",
  },
} as const);

export const CACHE_TTL_MS = 60000; // 1 minute
