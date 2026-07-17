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
