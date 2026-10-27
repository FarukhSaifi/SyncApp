import { AI_CONFIG } from "@constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


import { withRetry } from "./retries";

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns immediately on success", async () => {
    const fn = vi.fn(async () => "ok");
    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 10 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries retryable errors then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error(`${AI_CONFIG.ERR_HTTP_503} temp`))
      .mockResolvedValue("done");
    const promise = withRetry(fn, { attempts: 3, baseDelayMs: 10 });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("done");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws non-retryable errors without retrying", async () => {
    const fn = vi.fn(async () => {
      throw new Error("fatal-not-retryable-xyz");
    });
    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 10 })).rejects.toThrow("fatal-not-retryable-xyz");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
