/** Build-time security header helpers for next.config.ts */

const DEFAULT_PROD_API_ORIGIN = "https://sync-app-server.vercel.app";

export function getApiOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || DEFAULT_PROD_API_ORIGIN;
  try {
    return new URL(apiUrl).origin;
  } catch {
    return DEFAULT_PROD_API_ORIGIN;
  }
}

export function getSiteOrigin(): string {
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
  return "http://localhost:3000";
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
      value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
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
    ].join("; ");

    headers.push({ key: "Content-Security-Policy", value: csp });
  }

  return headers;
}
