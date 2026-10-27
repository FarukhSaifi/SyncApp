import { AI_CONFIG } from "@constants";
import * as googleCredentials from "@utils/googleCredentials";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_MESSAGES } from "@constants/messages";

import {
  buildGeminiConfig,
  buildModelCandidates,
  getAiCapabilities,
  getText,
  hasVertexAiConfig,
  resolveGeminiApiKey,
  resolveGoogleCloudLocation,
  resolveGoogleCloudProject,
} from "./client";

describe("ai/client helpers", () => {
  afterEach(() => {
    delete process.env[AI_CONFIG.ENV_GEMINI_API_KEY];
    delete process.env[AI_CONFIG.ENV_GOOGLE_API_KEY];
    delete process.env[AI_CONFIG.ENV_GOOGLE_CLOUD_PROJECT];
  });

  it("buildModelCandidates dedupes primary and fallbacks", () => {
    const list = buildModelCandidates("gemini-3.8-flash");
    expect(list[0]).toBe("gemini-3.8-flash");
    expect(new Set(list).size).toBe(list.length);
  });

  it("getText trims model output and rejects empty", () => {
    expect(getText({ text: "  hello  " } as never)).toBe("hello");
    expect(() => getText({ text: "" } as never)).toThrow(ERROR_MESSAGES.AI_EMPTY_RESPONSE);
  });

  it("buildGeminiConfig applies flash thinking budget override", () => {
    const cfg = buildGeminiConfig("gemini-3.8-flash", { maxOutputTokens: 512 });
    expect(cfg.maxOutputTokens).toBe(512);
    expect(cfg.thinkingConfig).toEqual({ thinkingBudget: 0 });
  });

  it("resolveGeminiApiKey reads env fallbacks", async () => {
    const { config } = await import("@config");
    const previous = config.geminiApiKey;
    config.geminiApiKey = "";
    process.env[AI_CONFIG.ENV_GEMINI_API_KEY] = "key-from-env";
    expect(resolveGeminiApiKey()).toBe("key-from-env");
    config.geminiApiKey = previous;
    process.env[AI_CONFIG.ENV_GOOGLE_CLOUD_PROJECT] = "proj-1";
    expect(resolveGoogleCloudProject()).toBe("proj-1");
  });

  it("resolveGoogleCloudLocation falls back to env and default", async () => {
    const { config } = await import("@config");
    const previous = config.googleCloudLocation;
    config.googleCloudLocation = "";
    process.env[AI_CONFIG.ENV_GOOGLE_CLOUD_LOCATION] = "europe-west1";
    expect(resolveGoogleCloudLocation()).toBe("europe-west1");
    delete process.env[AI_CONFIG.ENV_GOOGLE_CLOUD_LOCATION];
    expect(resolveGoogleCloudLocation()).toBe(AI_CONFIG.DEFAULT_LOCATION);
    config.googleCloudLocation = previous;
  });

  it("hasVertexAiConfig returns false when credential loading throws", () => {
    vi.spyOn(googleCredentials, "loadGoogleServiceAccountCredentials").mockImplementation(() => {
      throw new Error("bad creds");
    });
    process.env[AI_CONFIG.ENV_GOOGLE_CLOUD_PROJECT] = "proj";
    expect(hasVertexAiConfig()).toBe(false);
    vi.restoreAllMocks();
  });

  it("getAiCapabilities omits location for Studio provider", async () => {
    const { config } = await import("@config");
    config.geminiApiKey = "studio-key-1234567890";
    config.googleCloudProject = "";
    const caps = getAiCapabilities();
    expect(caps.location).toBeUndefined();
  });
});
