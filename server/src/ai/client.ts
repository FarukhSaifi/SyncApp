/**
 * Google GenAI client — Google AI Studio via GEMINI_API_KEY only.
 * Shared helpers tuned for structured JSON posts + reliable free-tier fallbacks.
 */
import { GenerateContentConfig, GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { AI_CONFIG, AI_SAFETY_SETTINGS, resolveContentModel } from "../constants";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";
import type { AiCapabilities, AiProvider, StudioGenerateOptions } from "../types";

export type { AiCapabilities, AiProvider, StudioGenerateOptions };

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

export function hasStudioKey(): boolean {
  return Boolean(resolveGeminiApiKey());
}

/** Capability snapshot for UI and health messaging. */
export function getAiCapabilities(): AiCapabilities {
  const ready = hasStudioKey();
  return {
    textAi: ready,
    imageAi: ready,
    provider: ready ? "studio" : "none",
    defaultModel: resolveContentModel(),
    studioUrl: AI_CONFIG.GEMINI_API_KEY_URL,
  };
}

/** Single Studio client for text and image generation. */
export function getAiClient(): GoogleGenAI {
  const key = resolveGeminiApiKey();
  if (!key) {
    throw new AppError(
      `${ERROR_MESSAGES.GEMINI_API_KEY_REQUIRED} ${ERROR_MESSAGES.GEMINI_API_KEY_URL}`,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  }

  const runtimeKey = `studio:${key.slice(0, 8)}`;
  if (cachedClient && cachedKey === runtimeKey) return cachedClient;

  cachedKey = runtimeKey;
  cachedClient = new GoogleGenAI({ apiKey: key });
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
 * Studio-tuned generation config:
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
  if (/flash/i.test(modelName) && AI_CONFIG.FLASH_THINKING_BUDGET === 0) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  return generationConfig;
}

/**
 * Unified generation call:
 * Executes generation requests using Google AI Studio via GEMINI_API_KEY.
 */
export async function studioGenerateContent(options: StudioGenerateOptions): Promise<GenerateContentResponse> {
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
