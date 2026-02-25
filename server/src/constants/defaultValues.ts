/**
 * Default Values and Configuration Constants
 */
export const DEFAULT_VALUES = Object.freeze({
  // Environment
  NODE_ENV_PRODUCTION: "production",
  NODE_ENV_DEVELOPMENT: "development",

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // JWT
  DEFAULT_JWT_EXPIRES_IN: "7d",

  // Rate Limiting
  DEFAULT_RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  DEFAULT_RATE_LIMIT_MAX_REQUESTS: 100,

  // CORS
  DEFAULT_CORS_ORIGIN: "http://localhost:3000",
  DEFAULT_DEV_ORIGINS: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://sync-app-client.vercel.app",
  ],

  // Body Parsing
  DEFAULT_BODY_LIMIT: "10mb",

  // Request Timeout
  DEFAULT_TIMEOUT_MS: 10000, // 10 seconds

  // Port
  DEFAULT_PORT: 9000,

  // Cache TTL (ms)
  CACHE_TTL_DEFAULT_MS: 300000, // 5 minutes
  CACHE_TTL_POSTS_LIST_MS: 120000, // 2 minutes
  /** Cache key segment for unauthenticated/public list requests */
  CACHE_KEY_PUBLIC: "public",

  // Google Cloud / AI
  DEFAULT_GOOGLE_CLOUD_LOCATION: "us-central1",
} as const);
