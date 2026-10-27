import { afterEach, describe, expect, it, vi } from "vitest";

import { devError, devLog, devWarn, logError } from "./logger";

describe("logger", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("devLog and devWarn call console in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    devLog("a", 1);
    devWarn("b");
    expect(logSpy).toHaveBeenCalledWith("a", 1);
    expect(warnSpy).toHaveBeenCalledWith("b");
  });

  it("devError logs in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    devError("detail");
    expect(errorSpy).toHaveBeenCalledWith("detail");
  });

  it("logError includes error object in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("boom");
    logError("failed", err);
    expect(errorSpy).toHaveBeenCalledWith("failed", err);
  });

  it("logError in production logs message only", () => {
    vi.stubEnv("NODE_ENV", "production");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    logError("failed", new Error("hidden"));
    expect(errorSpy).toHaveBeenCalledWith("failed");
  });
});
