import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./loadEnv", () => ({
  loadAppEnv: vi.fn(),
}));

const BASE_ENV: Record<string, string> = {
  VERCEL: "1",
  NODE_ENV: "test",
  PORT: "9000",
  MONGODB_URI: "mongodb://127.0.0.1:27017/syncapp-config-test",
  JWT_SECRET: "vitest-jwt-secret-key-32chars-min!!",
  JWT_EXPIRES_IN: "1d",
  ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  CORS_ORIGIN: "http://localhost:3000",
  GEMINI_API_KEY: "vitest-gemini-key",
  CRON_SECRET: "vitest-cron-secret",
  RATE_LIMIT_WINDOW_MS: "60000",
  RATE_LIMIT_MAX_REQUESTS: "10000",
};

describe("config bootstrap", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...BASE_ENV };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("exports parsed config when env is valid", async () => {
    const { config } = await import("./index");
    expect(config.mongoUri).toBe(BASE_ENV.MONGODB_URI);
    expect(config.geminiApiKey).toBe("vitest-gemini-key");
  });

  it("strips inline comments from gemini and bucket env values", async () => {
    process.env.GEMINI_API_KEY = "studio-key# ignore comment";
    process.env.GCS_BUCKET_NAME = "my-bucket#prod";
    const { config } = await import("./index");
    expect(config.geminiApiKey).toBe("studio-key");
    expect(config.gcpBucketName).toBe("my-bucket");
  });

  it("throws when env schema validation fails", async () => {
    process.env.JWT_SECRET = "too-short";
    await expect(import("./index")).rejects.toThrow(/Environment validation failed/);
  });

  it("requires CRON_SECRET in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "";
    await expect(import("./index")).rejects.toThrow(/CRON_SECRET/);
  });

  it("requires Studio or Vertex AI configuration", async () => {
    process.env.GEMINI_API_KEY = "";
    process.env.GOOGLE_CLOUD_PROJECT = "";
    delete process.env.GOOGLE_CREDENTIALS_JSON;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    await expect(import("./index")).rejects.toThrow(/AI/i);
  });
});
