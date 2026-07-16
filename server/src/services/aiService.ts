/**
 * AI Service – Google Gen AI SDK for blog post generation, optimisation, and images.
 * Uses GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_CREDENTIALS_JSON, ADC, or GEMINI_API_KEY.
 */

import { GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { config } from "../config";
import {
  AI_CONFIG,
  AI_PROMPTS,
  AI_RESPONSE_SCHEMA,
  AI_SAFETY_SETTINGS,
  buildFullPostSystemPrompt,
  buildFullPostUserPrompt,
  resolveContentModel,
} from "../constants";
import { DEFAULT_VALUES } from "../constants/defaultValues";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";
import type { GeneratePostResult, OptimiseForPublishInput } from "../types";
import { assertValidPostResult, parseJSONContent } from "../utils/aiResponseParse";
import { loadGoogleServiceAccountCredentials } from "../utils/googleCredentials";
import { logger } from "../utils/logger";

function ensureValidPostResult(result: GeneratePostResult, fallbackError: string): GeneratePostResult {
  try {
    return assertValidPostResult(result, fallbackError);
  } catch (err) {
    throw new AppError((err as Error).message, HTTP_STATUS.BAD_GATEWAY);
  }
}

type GeminiClientCache = { key: string; client: GoogleGenAI };

let cachedGeminiClient: GeminiClientCache | null = null;
let cachedStudioClient: GoogleGenAI | null = null;

interface GeminiCallOptions {
  userMessage: string;
  systemInstruction: string;
  maxOutputTokens: number;
  structuredJson?: boolean;
  tools?: Array<Record<string, unknown>>;
  modelOverride?: string;
}

function getModelName(override?: string): string {
  return override ? resolveContentModel(override) : config.googleAiModel || AI_CONFIG.DEFAULT_MODEL;
}

function getConfiguredLocation(): string {
  return (
    config.googleCloudLocation || process.env.GOOGLE_CLOUD_LOCATION || DEFAULT_VALUES.DEFAULT_GOOGLE_CLOUD_LOCATION
  );
}

function resolveVertexLocation(configuredLocation: string, modelName: string): string {
  const multiRegion = new Set(["global", "us", "eu"]);
  if (multiRegion.has(configuredLocation)) return configuredLocation;

  const needsGlobal = AI_CONFIG.VERTEX_GLOBAL_MODEL_PREFIXES.some((prefix) => modelName.startsWith(prefix));
  return needsGlobal ? AI_CONFIG.VERTEX_GLOBAL_FALLBACK_LOCATION : configuredLocation;
}

function resolveGeminiApiKey(): string {
  return (
    config.geminiApiKey ||
    process.env[AI_CONFIG.ENV_GEMINI_API_KEY]?.trim() ||
    process.env[AI_CONFIG.ENV_GOOGLE_API_KEY]?.trim() ||
    ""
  );
}

function usesGeminiStudio(): boolean {
  return Boolean(resolveGeminiApiKey());
}

function getProjectId(): string {
  let project = config.googleCloudProject || process.env.GOOGLE_CLOUD_PROJECT || "";
  const credentialsObj = loadGoogleServiceAccountCredentials();
  if (credentialsObj?.project_id && !project) {
    project = credentialsObj.project_id;
  }
  return project.trim();
}

function getStudioClient(): GoogleGenAI {
  if (cachedStudioClient) return cachedStudioClient;
  cachedStudioClient = new GoogleGenAI({ apiKey: resolveGeminiApiKey() });
  return cachedStudioClient;
}

function getGeminiClient(modelName: string, locationOverride?: string): GoogleGenAI {
  const project = getProjectId();
  if (!project) {
    throw new AppError(ERROR_MESSAGES.VERTEX_AI_PROJECT_MISSING, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  const location = locationOverride ?? resolveVertexLocation(getConfiguredLocation(), modelName);
  const cacheKey = `${project}:${location}`;

  if (cachedGeminiClient?.key === cacheKey) {
    return cachedGeminiClient.client;
  }

  const credentialsObj = loadGoogleServiceAccountCredentials();
  const opts: Record<string, unknown> = {
    vertexai: true,
    project,
    location,
  };

  if (credentialsObj) {
    opts.googleAuthOptions = { credentials: credentialsObj };
  }

  const client = new GoogleGenAI(opts);
  cachedGeminiClient = { key: cacheKey, client };
  return client;
}

function getGoogleGenAI(modelOverride?: string, locationOverride?: string): GoogleGenAI {
  if (usesGeminiStudio()) {
    return getStudioClient();
  }
  return getGeminiClient(getModelName(modelOverride), locationOverride);
}

/** Disable internal thinking only on models known to spend output tokens on reasoning. */
function supportsThinkingBudgetOff(modelName: string): boolean {
  return /gemini-2\.5|gemini-3\.1/i.test(modelName) && !/gemini-3\.5/i.test(modelName);
}

function buildGeminiConfig(modelName: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const generationConfig: Record<string, unknown> = {
    ...overrides,
    safetySettings: AI_SAFETY_SETTINGS,
  };

  if (/flash/i.test(modelName) && AI_CONFIG.FLASH_THINKING_BUDGET === 0 && supportsThinkingBudgetOff(modelName)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  return generationConfig;
}

function extractResponseText(result: GenerateContentResponse): string {
  const text = result.text?.trim();
  if (text) return text;

  const blockReason = result.promptFeedback?.blockReason;
  if (blockReason) {
    throw new AppError(
      `${ERROR_MESSAGES.AI_EMPTY_OR_BLOCKED_RESPONSE} (blocked: ${blockReason})`,
      HTTP_STATUS.BAD_GATEWAY,
    );
  }

  const finishReason = result.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
    throw new AppError(
      `${ERROR_MESSAGES.AI_EMPTY_OR_BLOCKED_RESPONSE} (finish: ${finishReason})`,
      HTTP_STATUS.BAD_GATEWAY,
    );
  }

  throw new AppError(ERROR_MESSAGES.AI_EMPTY_RESPONSE, HTTP_STATUS.BAD_GATEWAY);
}

function toBase64DataUrl(bytes: string | Uint8Array | Buffer, mime = "image/png"): string {
  const base64 = typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("base64");
  return `data:${mime};base64,${base64}`;
}

function normalizeVertexError(err: Error & { status?: number; details?: unknown }, fallbackMessage: string): never {
  if (err instanceof AppError) throw err;
  const msg = err.message || "";
  const is403 = msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("Forbidden");
  const is404 = msg.includes("404") || msg.includes("NOT_FOUND");
  const project = getProjectId() || config.googleCloudProject || process.env.GOOGLE_CLOUD_PROJECT;

  if (is403 && (msg.includes("BILLING_DISABLED") || msg.includes("billing to be enabled"))) {
    const billingUrl = project
      ? `https://console.cloud.google.com/billing/enable?project=${project}`
      : ERROR_MESSAGES.VERTEX_AI_BILLING_ENABLE_URL;
    const studioHint = ` Or set GEMINI_API_KEY from ${ERROR_MESSAGES.GEMINI_API_KEY_URL} in server/.env.dev (no GCP billing required).`;
    throw new AppError(
      `${ERROR_MESSAGES.VERTEX_AI_BILLING_DISABLED} Enable billing here: ${billingUrl}.${studioHint}`,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const isApiDisabled = msg.includes("Vertex AI API") && (msg.includes("not been used") || msg.includes("disabled"));
  if (is403 && isApiDisabled) {
    const enableUrl = project
      ? `https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/overview?project=${project}`
      : ERROR_MESSAGES.VERTEX_AI_API_ENABLE_URL;
    throw new AppError(`${ERROR_MESSAGES.VERTEX_AI_API_DISABLED} Enable it here: ${enableUrl}`, HTTP_STATUS.FORBIDDEN);
  }

  if (is404 && (msg.includes("/publishers/google/models/") || msg.includes("Publisher Model") || msg.includes("not found"))) {
    throw new AppError(ERROR_MESSAGES.VERTEX_AI_MODEL_NOT_FOUND, HTTP_STATUS.BAD_REQUEST);
  }

  const is429 = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Resource exhausted");
  if (is429) {
    throw new AppError(ERROR_MESSAGES.AI_IMAGE_RATE_LIMITED, HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  const isInvalidThinking =
    msg.includes("thinking") || msg.includes("thinkingConfig") || msg.includes("thinking_budget");
  if (isInvalidThinking) {
    throw new AppError(
      `${fallbackMessage}: model rejected thinking configuration. Set GOOGLE_AI_MODEL=gemini-3.5-flash and GOOGLE_CLOUD_LOCATION=global.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  throw new AppError(msg || fallbackMessage, err.status ?? HTTP_STATUS.BAD_GATEWAY, err.details);
}

function getModelAttempts(modelOverride?: string): Array<{ model: string; location: string }> {
  const primary = getModelName(modelOverride);
  const primaryLocation = resolveVertexLocation(getConfiguredLocation(), primary);
  const attempts: Array<{ model: string; location: string }> = [{ model: primary, location: primaryLocation }];

  for (const fallback of AI_CONFIG.FALLBACK_MODELS) {
    const exists = attempts.some((a) => a.model === fallback.model && a.location === fallback.location);
    if (!exists) attempts.push(fallback);
  }

  return attempts;
}

async function callGeminiGenerate(
  options: GeminiCallOptions,
  fallbackError: string,
): Promise<GenerateContentResponse> {
  const attempts = usesGeminiStudio()
    ? [{ model: getModelName(options.modelOverride), location: "" }]
    : getModelAttempts(options.modelOverride);

  let lastError: Error | null = null;
  const primaryModel = getModelName(options.modelOverride);

  for (const { model, location } of attempts) {
    const ai = getGoogleGenAI(options.modelOverride, location || undefined);
    const configs: Array<Record<string, unknown>> = [];

    if (options.structuredJson) {
      configs.push(
        buildGeminiConfig(model, {
          systemInstruction: options.systemInstruction,
          maxOutputTokens: options.maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: AI_RESPONSE_SCHEMA,
          ...(options.tools ? { tools: options.tools } : {}),
        }),
      );
      configs.push(
        buildGeminiConfig(model, {
          systemInstruction: `${options.systemInstruction}\n\nReturn ONLY valid JSON with keys: title, meta_description, tags, content_markdown, canonical_url.`,
          maxOutputTokens: options.maxOutputTokens,
          responseMimeType: "application/json",
          ...(options.tools ? { tools: options.tools } : {}),
        }),
      );
    } else {
      configs.push(
        buildGeminiConfig(model, {
          systemInstruction: options.systemInstruction,
          maxOutputTokens: options.maxOutputTokens,
        }),
      );
    }

    for (const geminiConfig of configs) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: options.userMessage,
          config: geminiConfig,
        } as Parameters<GoogleGenAI["models"]["generateContent"]>[0]);

        extractResponseText(result);
        if (
          !usesGeminiStudio() &&
          (model !== primaryModel || location !== resolveVertexLocation(getConfiguredLocation(), primaryModel))
        ) {
          logger.warn("AI request succeeded using fallback model/location", { model, location });
        }
        return result;
      } catch (err) {
        lastError = err as Error;
        const msg = (err as Error).message || "";
        const retryable =
          msg.includes("404") ||
          msg.includes("NOT_FOUND") ||
          msg.includes("thinking") ||
          msg.includes("responseSchema") ||
          msg.includes("response_schema") ||
          msg.includes("INVALID_ARGUMENT");
        if (!retryable) break;
      }
    }
  }

  return normalizeVertexError(
    (lastError as Error & { status?: number; details?: unknown }) || new Error(fallbackError),
    fallbackError,
  );
}

async function generateStructuredPost(
  userMessage: string,
  systemInstruction: string,
  maxOutputTokens: number,
  fallbackError: string,
  modelOverride?: string,
): Promise<GeneratePostResult> {
  try {
    const result = await callGeminiGenerate(
      {
        userMessage,
        systemInstruction,
        maxOutputTokens,
        structuredJson: true,
        modelOverride,
      },
      fallbackError,
    );
    return ensureValidPostResult(parseJSONContent(extractResponseText(result)), fallbackError);
  } catch (err) {
    return normalizeVertexError(err as Error & { status?: number; details?: unknown }, fallbackError);
  }
}

/**
 * Generate a full blog post from a keyword/topic with optional model and platform targets.
 */
export async function generatePost(
  keyword: string,
  options: { model?: string; targetPlatforms?: string[] } = {},
): Promise<GeneratePostResult> {
  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_KEYWORD_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  const systemInstruction = buildFullPostSystemPrompt(options.targetPlatforms);
  const userMessage = buildFullPostUserPrompt(keyword.trim(), options.targetPlatforms);

  if (config.aiUseGoogleSearchRetrieval) {
    try {
      const result = await callGeminiGenerate(
        {
          userMessage,
          systemInstruction,
          maxOutputTokens: AI_CONFIG.MAX_DRAFT_TOKENS,
          structuredJson: true,
          tools: [{ googleSearch: {} }],
          modelOverride: options.model,
        },
        ERROR_MESSAGES.AI_DRAFT_FAILED,
      );
      const parsed = ensureValidPostResult(
        parseJSONContent(extractResponseText(result)),
        ERROR_MESSAGES.AI_DRAFT_FAILED,
      );
      if (parsed.title && parsed.content) return parsed;
    } catch (err) {
      logger.warn("Grounded AI generate failed; falling back to standard generation", {
        error: (err as Error).message,
      });
    }
  }

  return generateStructuredPost(
    userMessage,
    systemInstruction,
    AI_CONFIG.MAX_DRAFT_TOKENS,
    ERROR_MESSAGES.AI_DRAFT_FAILED,
    options.model,
  );
}

/**
 * Optimise an existing draft before publishing.
 */
export async function optimiseForPublish(input: OptimiseForPublishInput): Promise<GeneratePostResult> {
  const content = input.content_markdown?.trim();
  if (!content) {
    throw new AppError(ERROR_MESSAGES.AI_CONTENT_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  const userMessage = AI_PROMPTS.OPTIMISE_FOR_PUBLISH_USER({
    title: input.title || "",
    meta_description: input.meta_description,
    tags: input.tags,
    content_markdown: content,
  });

  return generateStructuredPost(
    userMessage,
    AI_PROMPTS.OPTIMISE_FOR_PUBLISH_SYSTEM,
    AI_CONFIG.MAX_OPTIMISE_TOKENS,
    ERROR_MESSAGES.AI_OPTIMISE_FAILED,
  );
}

async function generateImagePromptFromTopic(topic: string, additionalPrompt?: string): Promise<string> {
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_KEYWORD_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }
  try {
    const result = await callGeminiGenerate(
      {
        userMessage: AI_PROMPTS.IMAGE_FROM_TOPIC_USER(topic.trim(), additionalPrompt),
        systemInstruction: AI_PROMPTS.IMAGE_FROM_TOPIC_SYSTEM,
        maxOutputTokens: AI_CONFIG.MAX_IMAGE_PROMPT_TOKENS,
      },
      ERROR_MESSAGES.AI_IMAGE_FAILED,
    );
    return extractResponseText(result);
  } catch (err) {
    return normalizeVertexError(err as Error & { status?: number; details?: unknown }, ERROR_MESSAGES.AI_IMAGE_FAILED);
  }
}

export async function generateImageFromTopic(
  topic: string,
  additionalPrompt?: string,
): Promise<{ imageDataUrl: string }> {
  const imagePrompt =
    additionalPrompt && additionalPrompt.trim()
      ? additionalPrompt.trim()
      : await generateImagePromptFromTopic(topic, additionalPrompt);

  if (!imagePrompt?.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_IMAGE_FAILED, HTTP_STATUS.BAD_GATEWAY);
  }

  if (usesGeminiStudio()) {
    throw new AppError(ERROR_MESSAGES.IMAGEN_REQUIRES_VERTEX, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  try {
    const ai = getGeminiClient(getModelName());
    const modelId = process.env.IMAGEN_MODEL || AI_CONFIG.IMAGEN_MODEL;

    const response = await ai.models.generateImages({
      model: modelId,
      prompt: imagePrompt.trim(),
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
      },
    });

    const img = response?.generatedImages?.[0]?.image;
    if (img?.imageBytes) {
      const mime = img.mimeType || "image/png";
      return { imageDataUrl: toBase64DataUrl(img.imageBytes, mime) };
    }
  } catch (err) {
    return normalizeVertexError(err as Error & { status?: number; details?: unknown }, ERROR_MESSAGES.AI_IMAGE_FAILED);
  }

  throw new AppError(ERROR_MESSAGES.AI_IMAGE_FAILED, HTTP_STATUS.BAD_GATEWAY);
}

export async function generateEdit(action: string, contextText: string): Promise<string> {
  if (!contextText || typeof contextText !== "string" || !contextText.trim()) {
    throw new AppError("Context text is required for AI edit actions", HTTP_STATUS.BAD_REQUEST);
  }
  try {
    const result = await callGeminiGenerate(
      {
        userMessage: AI_PROMPTS.EDITOR_TOOL_USER(action, contextText.trim()),
        systemInstruction: AI_PROMPTS.EDITOR_TOOL_SYSTEM,
        maxOutputTokens: AI_CONFIG.MAX_DRAFT_TOKENS,
      },
      ERROR_MESSAGES.AI_EDIT_FAILED,
    );
    return extractResponseText(result);
  } catch (err) {
    return normalizeVertexError(err as Error & { status?: number; details?: unknown }, ERROR_MESSAGES.AI_EDIT_FAILED);
  }
}
