/**
 * Google GenAI client — Google AI Studio via GEMINI_API_KEY only.
 * Shared helpers tuned for structured JSON posts + reliable free-tier fallbacks.
 */
import { GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { AI_CONFIG, AI_SAFETY_SETTINGS, resolveContentModel } from "../constants";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";

let cachedClient: GoogleGenAI | null = null;
let cachedKey = "";

export type AiProvider = "studio" | "none";

export interface AiCapabilities {
  textAi: boolean;
  /** True when a Studio key is present; image may use Imagen/Gemini image or SVG fallback. */
  imageAi: boolean;
  provider: AiProvider;
  defaultModel: string;
  studioUrl: string;
}

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

type StudioGenerateOptions = {
  model: string;
  contents: string;
  systemInstruction?: string;
  maxOutputTokens: number;
  /** Lower = more deterministic JSON; higher = more creative prose. */
  temperature?: number;
  topP?: number;
  responseMimeType?: string;
  responseSchema?: unknown;
  tools?: unknown[];
};

/**
 * Studio-tuned generation config:
 * - thinkingBudget 0 on Flash so maxOutputTokens go to visible JSON/text
 * - modest temperature for reliable structured posts
 */
export function buildGeminiConfig(modelName: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const generationConfig: Record<string, unknown> = {
    temperature: AI_CONFIG.TEMPERATURE_POST,
    topP: AI_CONFIG.TOP_P,
    ...overrides,
    safetySettings: AI_SAFETY_SETTINGS,
  };
  if (/flash/i.test(modelName) && AI_CONFIG.FLASH_THINKING_BUDGET === 0) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  return generationConfig;
}

/** One Studio generateContent call with consistent Studio settings. */
export async function studioGenerateContent(options: StudioGenerateOptions): Promise<GenerateContentResponse> {
  const ai = getAiClient();
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

  return ai.models.generateContent({
    model,
    contents,
    config: buildGeminiConfig(model, {
      systemInstruction,
      maxOutputTokens,
      temperature,
      topP,
      ...(responseMimeType ? { responseMimeType } : {}),
      ...(responseSchema ? { responseSchema } : {}),
      ...(tools ? { tools } : {}),
    }),
  } as never);
}
