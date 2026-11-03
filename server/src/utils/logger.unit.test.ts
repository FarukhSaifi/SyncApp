import { config } from "@config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLogger, requestLogger } from "./logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redacts sensitive meta in production", () => {
    config.nodeEnv = "production";
    const log = createLogger("TEST");
    log.info("hello", { apiKey: "secret-value", nested: { password: "x" } });
    const output = vi.mocked(console.log).mock.calls[0][0] as string;
    expect(output).toContain("[REDACTED]");
    expect(output).not.toContain("secret-value");
  });

  it("logs axios error details in development", () => {
    config.nodeEnv = "development";
    const log = createLogger("TEST");
    const err = Object.assign(new Error("upstream"), {
      isAxiosError: true,
      response: { status: 502, statusText: "Bad Gateway", data: { message: "fail" } },
    });
    log.error("External call failed", err, { requestId: "r1" });
    const output = vi.mocked(console.error).mock.calls[0][0] as string;
    expect(output).toContain("External call failed");
    expect(output).toContain("isAxiosError");
  });

  it("requestLogger emits error for 500 responses", () => {
    config.nodeEnv = "development";
    const req = {
      method: "POST",
      originalUrl: "/api/broken",
      ip: "127.0.0.1",
      get: () => "vitest",
    } as never;
    const listeners: Record<string, () => void> = {};
    const res = {
      statusCode: 500,
      on: (event: string, cb: () => void) => {
        listeners[event] = cb;
      },
    } as never;
    requestLogger(req, res, vi.fn());
    listeners.finish();
    expect(console.error).toHaveBeenCalled();
  });

  it("logger externalApi and cache helpers emit info/debug", () => {
    config.nodeEnv = "development";
    const log = createLogger("TEST");
    log.externalApi("Devto", "/articles", 120, 200, { ok: true });
    log.cache("get", "posts:list", true);
    expect(console.log).toHaveBeenCalled();
  });

  it("query helper logs debug metadata in development", () => {
    config.nodeEnv = "development";
    const log = createLogger("TEST");
    log.query("find", "Post", 12, { filter: "author" });
    const output = vi.mocked(console.log).mock.calls[vi.mocked(console.log).mock.calls.length - 1][0] as string;
    expect(output).toContain("DB find on Post");
  });

  it("safeStringify handles circular references in meta", () => {
    config.nodeEnv = "development";
    const log = createLogger("TEST");
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    log.info("circular meta", circular);
    const output = vi.mocked(console.log).mock.calls[0][0] as string;
    expect(output).toContain("[Circular]");
  });

  it("production error logs omit stack traces", () => {
    config.nodeEnv = "production";
    const log = createLogger("TEST");
    const err = Object.assign(new Error("upstream"), {
      stack: "Error: upstream\n    at Object.<anonymous> (/tmp/fake.js:1:1)",
      isAxiosError: true,
      code: "ECONNRESET",
    });
    log.error("External call failed", err);
    const output = vi.mocked(console.error).mock.calls[0][0] as string;
    expect(output).not.toContain("fake.js");
    expect(output).toContain("ECONNRESET");
  });

  it("redacts sensitive keys inside array meta and skips prototype keys", () => {
    config.nodeEnv = "production";
    const log = createLogger("TEST");
    log.info("array meta", { tokens: [{ token: "secret-token" }, { safe: "ok" }] });
    const output = vi.mocked(console.log).mock.calls[0][0] as string;
    expect(output).toContain("[REDACTED]");
    expect(output).not.toContain("secret-token");

    log.info("proto keys", { __proto__: { evil: true }, visible: "yes" });
    const protoOutput = vi.mocked(console.log).mock.calls[1][0] as string;
    expect(protoOutput).toContain("visible");
    expect(protoOutput).not.toContain("evil");
  });

  it("requestLogger emits warn for 404 responses", () => {
    config.nodeEnv = "development";
    const req = {
      method: "GET",
      originalUrl: "/api/missing",
      ip: "127.0.0.1",
      get: () => "vitest",
    } as never;
    const listeners: Record<string, () => void> = {};
    const res = {
      statusCode: 404,
      on: (event: string, cb: () => void) => {
        listeners[event] = cb;
      },
    } as never;
    const next = vi.fn();
    requestLogger(req, res, next);
    listeners.finish();
    expect(next).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalled();
  });
});
