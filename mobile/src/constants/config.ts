export const APP_CONFIG = Object.freeze({
  APP_NAME: "SyncApp",
  APP_DESCRIPTION: "Blog syndication made simple",
  COPYRIGHT: "© 2025 SyncApp. All rights reserved.",
  /** Dev fallback when EXPO_PUBLIC_API_BASE_URL is unset */
  DEFAULT_API_BASE: "https://sync-app-server.vercel.app/api",
  API_TIMEOUT: 10000,
  API_AI_TIMEOUT: 60000,
  API_AI_IMAGE_TIMEOUT: 65000,
  API_COVER_UPLOAD_TIMEOUT: 30000,
  DEFAULT_LIMIT: 20,
  POSTS_LIST_LIMIT: 50,
  TAGS_DISPLAY_LIMIT_CARD: 5,
  DATE_FORMAT_WITH_TIME: "DD-MM-YYYY hh:mm A",
  VALIDATION_MIN_PASSWORD: 6,
  VALIDATION_MIN_USERNAME: 3,
  SEARCH_DEBOUNCE_MS: 300,
  SAVED_TOAST_DURATION_MS: 3000,
  TOAST_AUTO_CLOSE_DELAY: 4000,
} as const);

export const EXTERNAL_LINKS = Object.freeze({
  MEDIUM_SETTINGS: "https://medium.com/me/settings",
  DEVTO_SETTINGS: "https://dev.to/settings/account",
  WORDPRESS_JWT_PLUGIN: "https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/",
  GITHUB_REPO: "https://github.com/your-repo/syncapp",
} as const);

export const STORAGE_KEYS = Object.freeze({
  AUTH_TOKEN: "token",
  THEME: "theme",
} as const);
