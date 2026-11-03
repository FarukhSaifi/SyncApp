import { config } from "@config";
import { AI_CONFIG, AI_PROVIDERS } from "@constants";
import * as googleCredentials from "@utils/googleCredentials";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const GoogleGenAI = vi.hoisted(() => vi.fn(function GoogleGenAIMock() {}));

vi.mock("@google/genai/node", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    GoogleGenAI,
  };
});

import { generateAiContent, getAiCapabilities, getAiClient, resolveAiProvider } from "./client";

describe("getAiClient", () => {
  const saved = {
    geminiApiKey: config.geminiApiKey,
    googleCloudProject: config.googleCloudProject,
    envGemini: process.env[AI_CONFIG.ENV_GEMINI_API_KEY],
    envGoogle: process.env[AI_CONFIG.ENV_GOOGLE_API_KEY],
    envProject: process.env[AI_CONFIG.ENV_GOOGLE_CLOUD_PROJECT],
  };

  beforeEach(() => {
    GoogleGenAI.mockClear();
    vi.spyOn(googleCredentials, "getVertexCredentialCacheHint").mockReturnValue("hint@test.iam");
    vi.spyOn(googleCredentials, "hasGoogleCloudCredentialsEnv").mockReturnValue(false);
    vi.spyOn(googleCredentials, "loadGoogleServiceAccountCredentials").mockReturnValue(null);
    config.geminiApiKey = saved.geminiApiKey;
    config.googleCloudProject = saved.googleCloudProject;
    process.env[AI_CONFIG.ENV_GEMINI_API_KEY] = saved.envGemini;
    process.env[AI_CONFIG.ENV_GOOGLE_API_KEY] = saved.envGoogle;
    process.env[AI_CONFIG.ENV_GOOGLE_CLOUD_PROJECT] = saved.envProject;
  });

  afterEach(() => {
    config.geminiApiKey = saved.geminiApiKey;
    config.googleCloudProject = saved.googleCloudProject;
    process.env[AI_CONFIG.ENV_GEMINI_API_KEY] = saved.envGemini;
    process.env[AI_CONFIG.ENV_GOOGLE_API_KEY] = saved.envGoogle;
    process.env[AI_CONFIG.ENV_GOOGLE_CLOUD_PROJECT] = saved.envProject;
    vi.restoreAllMocks();
  });

  it("throws when no AI provider is configured", () => {
    config.geminiApiKey = "";
    config.googleCloudProject = "";
    delete process.env[AI_CONFIG.ENV_GEMINI_API_KEY];
    delete process.env[AI_CONFIG.ENV_GOOGLE_API_KEY];
    delete process.env[AI_CONFIG.ENV_GOOGLE_CLOUD_PROJECT];
    expect(() => getAiClient()).toThrow();
  });

  it("builds Studio client and reuses cache for same key hint", () => {
    vi.mocked(googleCredentials.hasGoogleCloudCredentialsEnv).mockReturnValue(false);
    config.geminiApiKey = "studio-key-1234567890";
    config.googleCloudProject = "";

    expect(resolveAiProvider()).toBe(AI_PROVIDERS.STUDIO);

    const first = getAiClient();
    const second = getAiClient();
    expect(first).toBe(second);
    expect(GoogleGenAI).toHaveBeenCalled();
    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "studio-key-1234567890" });
  });

  it("builds Vertex client with service account credentials", () => {
    vi.mocked(googleCredentials.hasGoogleCloudCredentialsEnv).mockReturnValue(true);
    vi.mocked(googleCredentials.loadGoogleServiceAccountCredentials).mockReturnValue({
      [AI_CONFIG.CREDENTIAL_FIELD_CLIENT_EMAIL]: "vertex@test.iam.gserviceaccount.com",
      [AI_CONFIG.CREDENTIAL_FIELD_PRIVATE_KEY]: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
      [AI_CONFIG.CREDENTIAL_FIELD_PROJECT_ID]: "vertex-proj",
    });
    config.googleCloudProject = "vertex-proj";
    config.geminiApiKey = "";

    expect(resolveAiProvider()).toBe(AI_PROVIDERS.VERTEX);
    expect(getAiCapabilities().provider).toBe(AI_PROVIDERS.VERTEX);

    getAiClient();
    expect(GoogleGenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        vertexai: true,
        project: "vertex-proj",
      }),
    );
  });

  it("generateAiContent delegates to the active GenAI client", async () => {
    const generateContent = vi.fn(async () => ({ text: "hello" }));
    GoogleGenAI.mockImplementation(function GenAIWithModels() {
      return { models: { generateContent } };
    });
    config.geminiApiKey = "studio-key-1234567890";
    config.googleCloudProject = "";
    vi.mocked(googleCredentials.hasGoogleCloudCredentialsEnv).mockReturnValue(false);

    const result = await generateAiContent({
      model: "gemini-3.8-flash",
      contents: "Say hi",
      maxOutputTokens: 128,
      responseMimeType: "application/json",
    });
    expect(result.text).toBe("hello");
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.8-flash",
        contents: "Say hi",
      }),
    );
  });

  it("throws when Vertex credentials are incomplete", () => {
    vi.mocked(googleCredentials.hasGoogleCloudCredentialsEnv).mockReturnValue(true);
    vi.mocked(googleCredentials.loadGoogleServiceAccountCredentials).mockReturnValue({
      [AI_CONFIG.CREDENTIAL_FIELD_CLIENT_EMAIL]: "",
      [AI_CONFIG.CREDENTIAL_FIELD_PRIVATE_KEY]: "",
    });
    config.googleCloudProject = "vertex-proj";
    config.geminiApiKey = "";
    expect(() => getAiClient()).toThrow();
  });

  it("throws when Vertex project env is missing", () => {
    vi.mocked(googleCredentials.hasGoogleCloudCredentialsEnv).mockReturnValue(true);
    config.googleCloudProject = "";
    config.geminiApiKey = "";
    delete process.env[AI_CONFIG.ENV_GEMINI_API_KEY];
    delete process.env[AI_CONFIG.ENV_GOOGLE_API_KEY];
    delete process.env[AI_CONFIG.ENV_GOOGLE_CLOUD_PROJECT];
    expect(() => getAiClient()).toThrow();
  });

  it("builds Vertex client with ADC when SA JSON absent", () => {
    vi.mocked(googleCredentials.hasGoogleCloudCredentialsEnv).mockReturnValue(true);
    vi.mocked(googleCredentials.loadGoogleServiceAccountCredentials).mockReturnValue(null);
    config.googleCloudProject = "adc-proj";
    config.geminiApiKey = "";

    getAiClient();
    expect(GoogleGenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        vertexai: true,
        project: "adc-proj",
      }),
    );
  });
});
