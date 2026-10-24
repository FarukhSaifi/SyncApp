/**
 * Google GenAI client — Vertex AI primary (GCP project + SA), Google AI Studio fallback.
 * Shared helpers tuned for structured JSON posts + reliable model fallbacks.
 */

import { config } from "@config";
import { AI_CONFIG, AI_PROVIDERS, AI_SAFETY_SETTINGS, resolveContentModel } from "@constants";
import { GenerateContentConfig, GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { AppError } from "@middleware/errorHandler";
import type { AiCapabilities, AiGenerateOptions, AiProvider } from "@types";
import {
  getVertexCredentialCacheHint,
  hasGoogleCloudCredentialsEnv,
  loadGoogleServiceAccountCredentials,
} from "@utils/googleCredentials";
import { logger } from "@utils/logger";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

export type { AiCapabilities, AiGenerateOptions, AiProvider, StudioGenerateOptions } from "@types";

let cachedClient: GoogleGenAI | null = null;
let cachedKey = "";

export function resolveGeminiApiKey(): string {
  return (
    config.geminiApiKey ||
    process.env[AI_CONFIG.ENV_GEMINI_API_KEY]?.trim() ||
    process.env[AI_CONFIG.ENV_GOOGLE_API_KEY]?.trim() ||
    ""
  );
}

export function resolveGoogleCloudProject(): string {
  return config.googleCloudProject?.trim() || process.env[AI_CONFIG.ENV_GOOGLE_CLOUD_PROJECT]?.trim() || "";
}

export function resolveGoogleCloudLocation(): string {
  return (
    config.googleCloudLocation?.trim() ||
    process.env[AI_CONFIG.ENV_GOOGLE_CLOUD_LOCATION]?.trim() ||
    AI_CONFIG.DEFAULT_LOCATION
  );
}

/**
 * True when Vertex AI can be used: GCP project + credentials env
 * (SA JSON via GOOGLE_CREDENTIALS_JSON / GOOGLE_APPLICATION_CREDENTIALS, or ADC authorized_user file).
 * Org policies that block SA key creation can still use ADC for local/dev.
 */
export function hasVertexAiConfig(): boolean {
  if (!resolveGoogleCloudProject()) {
    return false;
  }
  try {
    return hasGoogleCloudCredentialsEnv() || Boolean(loadGoogleServiceAccountCredentials());
  } catch {
    return false;
  }
}

export function hasStudioKey(): boolean {
  return Boolean(resolveGeminiApiKey());
}

/** True when either Vertex (preferred) or Studio credentials are available. */
export function hasAiConfigured(): boolean {
  return hasVertexAiConfig() || hasStudioKey();
}

/** Active provider: Vertex wins when project + SA credentials are present. */
export function resolveAiProvider(): AiProvider {
  if (hasVertexAiConfig()) {
    return AI_PROVIDERS.VERTEX;
  }
  if (hasStudioKey()) {
    return AI_PROVIDERS.STUDIO;
  }
  return AI_PROVIDERS.NONE;
}

/** Capability snapshot for UI and health messaging. */
export function getAiCapabilities(): AiCapabilities {
  const provider = resolveAiProvider();
  const ready = provider !== AI_PROVIDERS.NONE;
  return {
    textAi: ready,
    imageAi: ready,
    provider,
    defaultModel: resolveContentModel(),
    studioUrl: AI_CONFIG.GEMINI_API_KEY_URL,
    project: resolveGoogleCloudProject() || undefined,
    location: provider === AI_PROVIDERS.VERTEX ? resolveGoogleCloudLocation() : undefined,
  };
}

function buildVertexClient(): GoogleGenAI {
  const project = resolveGoogleCloudProject();
  const location = resolveGoogleCloudLocation();

  if (!project || !hasGoogleCloudCredentialsEnv()) {
    throw new AppError(ERROR_MESSAGES.VERTEX_AI_CONFIG_REQUIRED, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  const credentials = loadGoogleServiceAccountCredentials();
  if (credentials) {
    const clientEmail =
      typeof credentials[AI_CONFIG.CREDENTIAL_FIELD_CLIENT_EMAIL] === "string"
        ? (credentials[AI_CONFIG.CREDENTIAL_FIELD_CLIENT_EMAIL] as string)
        : "";
    const privateKey =
      typeof credentials[AI_CONFIG.CREDENTIAL_FIELD_PRIVATE_KEY] === "string"
        ? (credentials[AI_CONFIG.CREDENTIAL_FIELD_PRIVATE_KEY] as string)
        : "";
    if (!clientEmail || !privateKey) {
      throw new AppError(ERROR_MESSAGES.VERTEX_AI_CREDENTIALS_INVALID, HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    const projectIdField = credentials[AI_CONFIG.CREDENTIAL_FIELD_PROJECT_ID];
    return new GoogleGenAI({
      vertexai: true,
      project,
      location,
      googleAuthOptions: {
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
          ...(typeof projectIdField === "string" ? { project_id: projectIdField } : {}),
        },
      },
    });
  }

  // Application Default Credentials (authorized_user) — used when org policy blocks SA keys.
  return new GoogleGenAI({
    vertexai: true,
    project,
    location,
  });
}

function buildStudioClient(): GoogleGenAI {
  const key = resolveGeminiApiKey();
  if (!key) {
    throw new AppError(
      `${ERROR_MESSAGES.GEMINI_API_KEY_REQUIRED} ${ERROR_MESSAGES.GEMINI_API_KEY_URL}`,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  }
  return new GoogleGenAI({ apiKey: key });
}

/**
 * Single GenAI client for text and image generation.
 * Prefer Vertex AI when GCP project + SA credentials are configured; otherwise Studio API key.
 */
export function getAiClient(): GoogleGenAI {
  const provider = resolveAiProvider();
  if (provider === AI_PROVIDERS.NONE) {
    throw new AppError(ERROR_MESSAGES.AI_PROVIDER_REQUIRED, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  const project = resolveGoogleCloudProject();
  const location = resolveGoogleCloudLocation();
  const key = resolveGeminiApiKey();
  let runtimeKey: string;
  if (provider === AI_PROVIDERS.VERTEX) {
    const emailHint = getVertexCredentialCacheHint();
    runtimeKey = `${AI_CONFIG.CLIENT_CACHE_PREFIX_VERTEX}:${project}:${location}:${emailHint}`;
  } else {
    runtimeKey = `${AI_CONFIG.CLIENT_CACHE_PREFIX_STUDIO}:${key.slice(0, AI_CONFIG.STUDIO_KEY_CACHE_HINT_LEN)}`;
  }

  if (cachedClient && cachedKey === runtimeKey) {
    return cachedClient;
  }

  cachedKey = runtimeKey;
  cachedClient = provider === AI_PROVIDERS.VERTEX ? buildVertexClient() : buildStudioClient();
  if (provider === AI_PROVIDERS.VERTEX) {
    logger.info(
      `${AI_CONFIG.LOG_CLIENT_VERTEX}${project}${AI_CONFIG.LOG_CLIENT_LOCATION_SEP}${location}${AI_CONFIG.LOG_CLIENT_VERTEX_CLOSE}`,
    );
  } else {
    logger.info(AI_CONFIG.LOG_CLIENT_STUDIO);
  }
  return cachedClient;
}

export function getModelName(override?: string): string {
  return override ? resolveContentModel(override) : config.googleAiModel;
}

export function buildModelCandidates(primary: string): string[] {
  return [...new Set([primary, ...AI_CONFIG.MODEL_FALLBACKS].filter(Boolean))];
}

export function getText(result: GenerateContentResponse): string {
  const text = result.text;
  if (!text) {
    throw new Error(ERROR_MESSAGES.AI_EMPTY_RESPONSE);
  }
  return text.trim();
}

/**
 * Generation config shared by Vertex and Studio:
 * - thinkingBudget 0 on Flash so maxOutputTokens go to visible JSON/text
 * - modest temperature for reliable structured posts
 */
export function buildGeminiConfig(modelName: string, overrides: GenerateContentConfig = {}): GenerateContentConfig {
  const generationConfig: GenerateContentConfig = {
    temperature: AI_CONFIG.TEMPERATURE_POST,
    topP: AI_CONFIG.TOP_P,
    safetySettings: AI_SAFETY_SETTINGS,
    ...overrides,
  };
  if (AI_CONFIG.FLASH_MODEL_NAME_PATTERN.test(modelName) && AI_CONFIG.FLASH_THINKING_BUDGET === 0) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  return generationConfig;
}

/**
 * Unified generation call via the active provider (Vertex preferred, else Studio).
 */
export async function generateAiContent(options: AiGenerateOptions): Promise<GenerateContentResponse> {
  const {
    model,
    contents,
    systemInstruction,
    maxOutputTokens,
    temperature = AI_CONFIG.TEMPERATURE_POST,
    topP = AI_CONFIG.TOP_P,
    responseMimeType,
    responseSchema,
    tools,
  } = options;

  const generationConfig = buildGeminiConfig(model, {
    systemInstruction,
    maxOutputTokens,
    temperature,
    topP,
    ...(responseMimeType ? { responseMimeType } : {}),
    ...(responseSchema ? { responseSchema } : {}),
    ...(tools ? { tools } : {}),
  });

  const ai = getAiClient();
  return ai.models.generateContent({
    model,
    contents,
    config: generationConfig,
  });
}
