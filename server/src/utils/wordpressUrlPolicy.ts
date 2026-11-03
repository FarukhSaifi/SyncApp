import { ERROR_MESSAGES } from "@constants";

import { WORDPRESS } from "@constants/wordpress";

export interface WordpressSiteContext {
  /** User-facing site URL (https://farukhsaifi.wordpress.com). */
  siteUrl: string;
  /** Hostname used for WP.com public-api sites/{site} segment. */
  siteKey: string;
  isWordpressCom: boolean;
  apiBase: string;
}

function dwordToIpv4(n: number): string | null {
  if (!Number.isSafeInteger(n) || n < 0 || n > 0xffffffff) {
    return null;
  }
  return `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`;
}

/**
 * Normalize alternate IPv4 spellings (decimal dword, hex dword, short dotted)
 * into a.b.c.d, or return null when not an IPv4-shaped hostname.
 */
function normalizeIpv4Hostname(hostname: string): string | null {
  const host = hostname.toLowerCase();

  if (/^\d+$/.test(host)) {
    return dwordToIpv4(Number(host));
  }

  if (/^0x[0-9a-f]+$/i.test(host)) {
    return dwordToIpv4(Number.parseInt(host, 16));
  }

  const dotted = host.split(".");
  if (dotted.length < 2 || dotted.length > 4) {
    return null;
  }

  const parts: number[] = [];
  for (const part of dotted) {
    if (part === "") {
      return null;
    }
    let value: number;
    if (/^0x[0-9a-f]+$/i.test(part)) {
      value = Number.parseInt(part, 16);
    } else if (/^0[0-7]+$/.test(part)) {
      value = Number.parseInt(part, 8);
    } else if (/^\d+$/.test(part)) {
      value = Number(part);
    } else {
      return null;
    }
    if (!Number.isInteger(value) || value < 0 || value > 255) {
      return null;
    }
    parts.push(value);
  }

  while (parts.length < 4) {
    parts.splice(parts.length - 1, 0, 0);
  }

  return parts.join(".");
}

function isIpv4PrivateLiteral(ipv4: string): boolean {
  const parts = ipv4.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  // Carrier-grade NAT / shared address space
  if (a === 100 && b >= 64 && b <= 127) {
    return true;
  }
  return false;
}

function isIpv4Private(hostname: string): boolean {
  const normalized = normalizeIpv4Hostname(hostname);
  if (!normalized) {
    return false;
  }
  return isIpv4PrivateLiteral(normalized);
}

function isIpv6Blocked(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (!host.includes(":")) {
    return false;
  }
  if (host === "::1" || host === "::" || host === "0:0:0:0:0:0:0:1") {
    return true;
  }
  // Link-local fe80::/10
  if (/^fe[89ab]/i.test(host)) {
    return true;
  }
  // Unique local fc00::/7
  if (/^f[cd]/i.test(host)) {
    return true;
  }
  // IPv4-mapped dotted form (::ffff:127.0.0.1)
  const dottedMapped = host.match(/:ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (dottedMapped && isIpv4PrivateLiteral(dottedMapped[1])) {
    return true;
  }
  // IPv4-mapped hex form (::ffff:7f00:1 → 127.0.0.1)
  const hexMapped = host.match(/:ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (hexMapped) {
    const hi = Number.parseInt(hexMapped[1], 16);
    const lo = Number.parseInt(hexMapped[2], 16);
    if (Number.isFinite(hi) && Number.isFinite(lo)) {
      const ipv4 = `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
      if (isIpv4PrivateLiteral(ipv4)) {
        return true;
      }
    }
  }
  return false;
}

/** Normalize URL.hostname (some runtimes keep IPv6 brackets). */
function normalizeHostname(hostname: string): string {
  let host = hostname.toLowerCase().replace(/\.$/, "");
  if (host.startsWith("[") && host.endsWith("]")) {
    host = host.slice(1, -1);
  }
  return host;
}

function isBlockedHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host) {
    return true;
  }
  if ((WORDPRESS.BLOCKED_HOSTNAMES as readonly string[]).includes(host)) {
    return true;
  }
  if (host === "::1" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return true;
  }
  if (isIpv4Private(host) || isIpv6Blocked(host)) {
    return true;
  }
  return false;
}

export function isWordpressComHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  return host === WORDPRESS.WORDPRESS_COM_HOST || host.endsWith(WORDPRESS.WORDPRESS_COM_HOST_SUFFIX);
}

/**
 * Validate a user-provided WordPress site URL (HTTPS only, no private hosts).
 * Throws Validation-style Error with ERROR_MESSAGES when invalid.
 */
export function assertSafeWordpressSiteUrl(raw: string): URL {
  const trimmed = (raw || "").trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(ERROR_MESSAGES.WORDPRESS_SITE_URL_INVALID);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(ERROR_MESSAGES.WORDPRESS_SITE_URL_HTTPS_REQUIRED);
  }
  if (parsed.username || parsed.password) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_SITE_URL_INVALID);
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST);
  }
  return parsed;
}

/**
 * Resolve API base for posts/media/tags.
 * WordPress.com always uses public-api.wordpress.com (never the blog origin).
 */
export function resolveWordpressSiteContext(rawSiteUrl: string): WordpressSiteContext {
  const parsed = assertSafeWordpressSiteUrl(rawSiteUrl);
  const siteUrl = `${parsed.origin}`;
  const siteKey = normalizeHostname(parsed.hostname);
  const isWordpressCom = isWordpressComHost(siteKey);

  if (isWordpressCom) {
    return {
      siteUrl,
      siteKey,
      isWordpressCom: true,
      apiBase: `${WORDPRESS.PUBLIC_API_ORIGIN}${WORDPRESS.PUBLIC_API_SITE_PREFIX}/${encodeURIComponent(siteKey)}`,
    };
  }

  return {
    siteUrl,
    siteKey,
    isWordpressCom: false,
    apiBase: `${siteUrl}${WORDPRESS.WP_JSON_PREFIX}`,
  };
}

export function wordpressPostsUrl(ctx: WordpressSiteContext): string {
  return `${ctx.apiBase}/posts`;
}

export function wordpressPostByIdUrl(ctx: WordpressSiteContext, id: string): string {
  return `${ctx.apiBase}/posts/${encodeURIComponent(id)}`;
}

export function wordpressMediaUrl(ctx: WordpressSiteContext): string {
  return `${ctx.apiBase}/media`;
}

export function wordpressTagsUrl(ctx: WordpressSiteContext): string {
  return `${ctx.apiBase}/tags`;
}

/**
 * Allowlist for server-side cover/media downloads (SSRF).
 * Same host policy as site URLs; HTTP/HTTPS only for public hosts.
 */
export function assertSafeOutboundMediaUrl(raw: string): URL {
  const trimmed = (raw || "").trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(ERROR_MESSAGES.WORDPRESS_MEDIA_URL_BLOCKED);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(ERROR_MESSAGES.WORDPRESS_MEDIA_URL_BLOCKED);
  }
  if (parsed.username || parsed.password) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_MEDIA_URL_BLOCKED);
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new Error(ERROR_MESSAGES.WORDPRESS_MEDIA_URL_BLOCKED);
  }
  return parsed;
}

export function isSafeOutboundMediaUrl(raw: string): boolean {
  try {
    assertSafeOutboundMediaUrl(raw);
    return true;
  } catch {
    return false;
  }
}
