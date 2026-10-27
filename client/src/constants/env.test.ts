import { afterEach, describe, expect, it, vi } from "vitest";

import {
  API_ORIGINS,
  isLocalDevRuntime,
  isPrivateNetworkHostname,
  resolveApiBase,
  resolveApiOrigin,
  resolveSiteOrigin,
} from "./env";

describe("env helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("isPrivateNetworkHostname matches loopback and RFC1918", () => {
    expect(isPrivateNetworkHostname("localhost")).toBe(true);
    expect(isPrivateNetworkHostname("127.0.0.1")).toBe(true);
    expect(isPrivateNetworkHostname("192.168.1.10")).toBe(true);
    expect(isPrivateNetworkHostname("10.0.0.5")).toBe(true);
    expect(isPrivateNetworkHostname("172.16.0.1")).toBe(true);
    expect(isPrivateNetworkHostname("example.com")).toBe(false);
  });

  it("resolveApiOrigin uses development default in local runtime", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "");
    expect(resolveApiOrigin()).toBe(API_ORIGINS.DEVELOPMENT);
  });

  it("resolveSiteOrigin prefers NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.example.com/path");
    expect(resolveSiteOrigin()).toBe("https://app.example.com");
  });

  it("resolveApiBase returns /api suffix in local dev", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(resolveApiBase()).toContain("/api");
  });

  it("isLocalDevRuntime is false in production on Vercel", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    expect(isLocalDevRuntime()).toBe(false);
  });

  it("resolveApiOrigin uses production backend when not local dev", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NEXT_PUBLIC_API_BACKEND_URL", "https://api.example.com/v1/extra");
    expect(resolveApiOrigin()).toBe("https://api.example.com");
  });

  it("resolveSiteOrigin falls back to VERCEL_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "preview-abc.vercel.app");
    expect(resolveSiteOrigin()).toBe("https://preview-abc.vercel.app");
  });

  it("resolveApiBase uses proxy path in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    expect(resolveApiBase()).toBe("/api");
  });

  it("resolveApiOrigin uses LAN host when testing from phone on network", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "");
    vi.stubGlobal("window", {
      location: { hostname: "192.168.1.59" },
    } as Window);
    expect(resolveApiOrigin()).toBe("http://192.168.1.59:9000");
    vi.unstubAllGlobals();
  });

  it("resolveApiOrigin prefers custom backend URL in local dev", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NEXT_PUBLIC_API_BACKEND_URL", "http://127.0.0.1:9100/api");
    expect(resolveApiOrigin()).toBe("http://127.0.0.1:9100");
  });

  it("resolveApiOrigin falls back when backend URL is invalid in local dev", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NEXT_PUBLIC_API_BACKEND_URL", "not-a-valid-url");
    expect(resolveApiOrigin()).toBe(API_ORIGINS.DEVELOPMENT);
  });

  it("resolveApiOrigin falls back when production backend URL is invalid", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NEXT_PUBLIC_API_BACKEND_URL", ":::bad");
    expect(resolveApiOrigin()).toBe(API_ORIGINS.PRODUCTION);
  });

  it("resolveSiteOrigin returns raw configured value when URL parse fails", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not-a-url");
    expect(resolveSiteOrigin()).toBe("not-a-url");
  });

  it("resolveSiteOrigin uses local default when no env is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(resolveSiteOrigin()).toBe("http://localhost:3000");
  });

  it("resolveApiBase uses backend env on SSR in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NEXT_PUBLIC_API_BACKEND_URL", "https://api.example.com");
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    try {
      expect(resolveApiBase()).toBe("https://api.example.com/api");
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
