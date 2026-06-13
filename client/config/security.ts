/** Build-time security header helpers for next.config.ts */

import { resolveApiOrigin, resolveSiteOrigin } from "../src/constants/env";

export function getApiOrigin(): string {
  return resolveApiOrigin();
}

export function getSiteOrigin(): string {
  return resolveSiteOrigin();
}

type Header = { key: string; value: string };

export function buildSecurityHeaders(isProd: boolean): Header[] {
  const apiOrigin = getApiOrigin();
  const headers: Header[] = [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    { key: "X-Download-Options", value: "noopen" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  ];

  if (isProd) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' ${apiOrigin}`,
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    headers.push({ key: "Content-Security-Policy", value: csp });
  }

  return headers;
}
