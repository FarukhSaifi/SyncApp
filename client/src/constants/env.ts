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

/** Local loopback hostnames. */
export const LOCAL_DEV_HOSTS = Object.freeze(["localhost", "127.0.0.1"] as const);

export const API_PATH_SUFFIX = "/api" as const;

/** Same-origin API path used in production (Next.js rewrite). */
export const PROXY_API_BASE = "/api" as const;

const DEFAULT_API_PORT = "9000";

/** True for RFC1918 / link-local hosts used when testing from phone on LAN. */
export function isPrivateNetworkHostname(hostname: string): boolean {
  if (LOCAL_DEV_HOSTS.includes(hostname as (typeof LOCAL_DEV_HOSTS)[number])) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
}

/** True when the app runs on a local / LAN dev origin (browser or SSR). */
export function isLocalDevRuntime(): boolean {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) return false;
  if (typeof window !== "undefined") {
    return isPrivateNetworkHostname(window.location.hostname);
  }
  return true;
}

/** Resolve backend origin (no /api suffix) for rewrites and CSP connect-src. */
export function resolveApiOrigin(): string {
  const isLocalDev = isLocalDevRuntime();
  const apiUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL;

  if (isLocalDev) {
    // Phone / LAN: hit Express on the same host so we skip the Next rewrite timeout path.
    if (typeof window !== "undefined" && isPrivateNetworkHostname(window.location.hostname)) {
      const host = window.location.hostname;
      if (!LOCAL_DEV_HOSTS.includes(host as (typeof LOCAL_DEV_HOSTS)[number])) {
        return `http://${host}:${DEFAULT_API_PORT}`;
      }
    }
    if (!apiUrl) return API_ORIGINS.DEVELOPMENT;
    try {
      const origin = new URL(apiUrl).origin;
      if (origin.includes("vercel.app")) return API_ORIGINS.DEVELOPMENT;
      return origin;
    } catch {
      return API_ORIGINS.DEVELOPMENT;
    }
  }

  const resolved = apiUrl || API_ORIGINS.PRODUCTION;
  try {
    return new URL(resolved).origin;
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

/** Append /api if missing. */
function withApiSuffix(base: string): string {
  const trimmed = base.replace(/\/$/, "");
  return trimmed.endsWith(API_PATH_SUFFIX) ? trimmed : `${trimmed}${API_PATH_SUFFIX}`;
}

/** Resolve full API base URL including /api path segment. */
export function resolveApiBase(): string {
  if (isLocalDevRuntime()) {
    return withApiSuffix(resolveApiOrigin());
  }

  if (typeof window === "undefined") {
    const isProd = process.env.NODE_ENV === "production";
    const envUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL;
    const base = envUrl || (isProd ? API_ORIGINS.PRODUCTION : API_ORIGINS.DEVELOPMENT);
    return withApiSuffix(base);
  }

  return PROXY_API_BASE;
}
