/**
 * API route path segments (mounted under /api in index).
 * Single source of truth for route registration.
 */
export const ROUTES = Object.freeze({
  AUTH: "/auth",
  POSTS: "/posts",
  CREDENTIALS: "/credentials",
  PUBLISH: "/publish",
  MDX: "/mdx",
  USERS: "/users",
  AI: "/ai",
  UPLOAD: "/upload",
  CRON: "/cron",
  ANALYTICS: "/analytics",
  LINKEDIN: "/linkedin",
} as const);

/** Browser paths for API documentation (mounted under /api; no DB required). */
export const OPENAPI_UI = Object.freeze({
  DOCS_PATH: "/api/docs",
  SPEC_PATH: "/api/openapi.json",
  SPEC_FILENAME: "openapi.yaml",
  TITLE: "SyncApp API",
  SPEC_NOT_FOUND: "OpenAPI spec file not found (expected src/openapi/openapi.yaml)",
  /** Logged when docs are skipped because NODE_ENV / VERCEL_ENV is production. */
  DISABLED_IN_PRODUCTION_LOG: "OpenAPI / Swagger UI disabled in production",
} as const);
