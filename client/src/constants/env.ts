/**
 * Shared environment-derived origins — used at build time (next.config, CSP) and runtime (API client).
 */

export const API_ORIGINS = Object.freeze({
  PRODUCTION: "https://sync-app-server.vercel.app",
  DEVELOPMENT: "http://localhost:9000",
} as const);

export const SITE_ORIGINS = Object.freeze({
  LOCAL: "http://localhost:3000",
} as const);

/** Resolve backend origin (no /api suffix) for rewrites and CSP connect-src. */
export function resolveApiOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || API_ORIGINS.PRODUCTION;
  try {
    return new URL(apiUrl).origin;
  } catch {
    return API_ORIGINS.PRODUCTION;
  }
}

/** Resolve public site origin for metadata and OG tags. */
export function resolveSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      return configured;
    }
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return SITE_ORIGINS.LOCAL;
}

/** Resolve full API base URL including /api path segment. */
export function resolveApiBase(): string {
  if (typeof window === "undefined") {
    const isProd = process.env.NODE_ENV === "production";
    const envUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL;
    const base = envUrl || (isProd ? API_ORIGINS.PRODUCTION : API_ORIGINS.DEVELOPMENT);
    return base.endsWith("/api") ? base : `${base}/api`;
  }
  return "/api";
}
