import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const existsSync = vi.hoisted(() => vi.fn());
const dotenvConfig = vi.hoisted(() => vi.fn());

vi.mock("fs", () => ({
  existsSync,
}));

vi.mock("dotenv", () => ({
  default: { config: dotenvConfig },
}));

describe("loadAppEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    existsSync.mockReset();
    dotenvConfig.mockReset();
    process.env = { ...originalEnv, VERCEL: "", VERCEL_ENV: "", NODE_ENV: "test" };
    delete process.env.APP_ENV;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns dev and loads .env.dev when present", async () => {
    existsSync.mockImplementation((p: string) => String(p).endsWith(".env.dev"));
    const { loadAppEnv } = await import("./loadEnv");
    expect(loadAppEnv()).toBe("dev");
    expect(dotenvConfig).toHaveBeenCalledWith(expect.objectContaining({ override: true }));
  });

  it("skips dotenv on Vercel", async () => {
    process.env.VERCEL = "1";
    const { loadAppEnv } = await import("./loadEnv");
    expect(loadAppEnv()).toBe("dev");
    expect(dotenvConfig).not.toHaveBeenCalled();
  });

  it("falls back to .env when env-specific file missing", async () => {
    existsSync.mockImplementation((p: string) => String(p).endsWith(".env"));
    const { loadAppEnv } = await import("./loadEnv");
    expect(loadAppEnv()).toBe("dev");
    expect(dotenvConfig).toHaveBeenCalledWith(expect.objectContaining({ path: expect.stringMatching(/\.env$/) }));
  });

  it("uses prod when APP_ENV=prod", async () => {
    process.env.APP_ENV = "prod";
    existsSync.mockReturnValue(false);
    const { loadAppEnv } = await import("./loadEnv");
    expect(loadAppEnv()).toBe("prod");
  });
});
