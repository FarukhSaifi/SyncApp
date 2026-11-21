import { ERROR_MESSAGES } from "@constants";
import { describe, expect, it } from "vitest";

import { WORDPRESS } from "@constants/wordpress";

import {
  assertSafeOutboundMediaUrl,
  assertSafeWordpressSiteUrl,
  isSafeOutboundMediaUrl,
  isWordpressComHost,
  resolveWordpressSiteContext,
  wordpressMediaUrl,
  wordpressPostsUrl,
} from "./wordpressUrlPolicy";

describe("wordpressUrlPolicy", () => {
  it("detects WordPress.com hosts", () => {
    expect(isWordpressComHost("farukhsaifi.wordpress.com")).toBe(true);
    expect(isWordpressComHost("wordpress.com")).toBe(true);
    expect(isWordpressComHost("www.wordpress.com")).toBe(true);
    expect(isWordpressComHost("blog.example.com")).toBe(false);
    expect(isWordpressComHost("evilwordpress.com")).toBe(false);
    expect(isWordpressComHost("wordpress.com.evil.com")).toBe(false);
  });

  it("requires HTTPS site URLs and blocks private hosts", () => {
    expect(() => assertSafeWordpressSiteUrl("http://farukhsaifi.wordpress.com")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_HTTPS_REQUIRED,
    );
    expect(() => assertSafeWordpressSiteUrl("https://127.0.0.1")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://169.254.169.254")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://10.0.0.5")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://172.16.1.1")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://192.168.1.10")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://100.64.1.1")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://localhost")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://app.localhost")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://printer.local")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://metadata.google.internal")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://metadata")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://user:pass@blog.example.com")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_INVALID,
    );
    expect(() => assertSafeWordpressSiteUrl("not-a-url")).toThrow(ERROR_MESSAGES.WORDPRESS_SITE_URL_INVALID);
  });

  it("blocks alternate IPv4 and IPv6 spellings for site URLs", () => {
    expect(() => assertSafeWordpressSiteUrl("https://2130706433")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://0x7f000001")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://127.1")).toThrow(ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST);
    expect(() => assertSafeWordpressSiteUrl("https://0177.0.0.1")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://[::1]")).toThrow(ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST);
    expect(() => assertSafeWordpressSiteUrl("https://[fe80::1]")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://[fd12::1]")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
    expect(() => assertSafeWordpressSiteUrl("https://[::ffff:127.0.0.1]")).toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_BLOCKED_HOST,
    );
  });

  it("routes WordPress.com sites to public-api only", () => {
    const ctx = resolveWordpressSiteContext("https://farukhsaifi.wordpress.com/");
    expect(ctx.isWordpressCom).toBe(true);
    expect(ctx.apiBase).toBe(
      `${WORDPRESS.PUBLIC_API_ORIGIN}${WORDPRESS.PUBLIC_API_SITE_PREFIX}/farukhsaifi.wordpress.com`,
    );
    expect(ctx.apiBase).not.toContain("/wp-json");
    expect(ctx.apiBase).not.toContain("farukhsaifi.wordpress.com/wp");
    expect(wordpressPostsUrl(ctx)).toBe(
      `${WORDPRESS.PUBLIC_API_ORIGIN}${WORDPRESS.PUBLIC_API_SITE_PREFIX}/farukhsaifi.wordpress.com/posts`,
    );
    expect(wordpressMediaUrl(ctx)).toBe(
      `${WORDPRESS.PUBLIC_API_ORIGIN}${WORDPRESS.PUBLIC_API_SITE_PREFIX}/farukhsaifi.wordpress.com/media`,
    );
  });

  it("keeps self-hosted sites on origin /wp-json", () => {
    const ctx = resolveWordpressSiteContext("https://blog.example.com");
    expect(ctx.isWordpressCom).toBe(false);
    expect(wordpressPostsUrl(ctx)).toBe("https://blog.example.com/wp-json/wp/v2/posts");
    expect(wordpressMediaUrl(ctx)).toBe("https://blog.example.com/wp-json/wp/v2/media");
  });

  it("blocks unsafe media fetch URLs with the same host policy", () => {
    expect(() => assertSafeOutboundMediaUrl("https://localhost/x.png")).toThrow(
      ERROR_MESSAGES.WORDPRESS_MEDIA_URL_BLOCKED,
    );
    expect(() => assertSafeOutboundMediaUrl("http://192.168.0.1/cover.jpg")).toThrow(
      ERROR_MESSAGES.WORDPRESS_MEDIA_URL_BLOCKED,
    );
    expect(() => assertSafeOutboundMediaUrl("https://169.254.169.254/latest/meta-data")).toThrow(
      ERROR_MESSAGES.WORDPRESS_MEDIA_URL_BLOCKED,
    );
    expect(() => assertSafeOutboundMediaUrl("https://metadata.google.internal/computeMetadata/v1")).toThrow(
      ERROR_MESSAGES.WORDPRESS_MEDIA_URL_BLOCKED,
    );
    expect(() => assertSafeOutboundMediaUrl("file:///etc/passwd")).toThrow(ERROR_MESSAGES.WORDPRESS_MEDIA_URL_BLOCKED);
    expect(() => assertSafeOutboundMediaUrl("ftp://cdn.example/cover.webp")).toThrow(
      ERROR_MESSAGES.WORDPRESS_MEDIA_URL_BLOCKED,
    );
    expect(() => assertSafeOutboundMediaUrl("https://user:pass@cdn.example/x.png")).toThrow(
      ERROR_MESSAGES.WORDPRESS_MEDIA_URL_BLOCKED,
    );
    expect(assertSafeOutboundMediaUrl("https://cdn.example/cover.webp").hostname).toBe("cdn.example");
    expect(assertSafeOutboundMediaUrl("http://cdn.example/cover.webp").protocol).toBe("http:");
    expect(isSafeOutboundMediaUrl("https://cdn.example/a.png")).toBe(true);
    expect(isSafeOutboundMediaUrl("https://127.0.0.1/a.png")).toBe(false);
  });

  it("exposes media size and type caps used by cover download", () => {
    expect(WORDPRESS.MEDIA.MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(WORDPRESS.MEDIA.ALLOWED_MIME_PREFIX).toBe("image/");
    expect(WORDPRESS.MEDIA.FETCH_TIMEOUT_MS).toBe(15_000);
    expect(WORDPRESS.MEDIA.MAX_REDIRECTS).toBe(3);
  });
});
