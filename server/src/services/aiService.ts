/**
 * AI Service – Google Gen AI SDK for outline and draft; optional Imagen for featured image
 * Steps: SEO Analyst (outline) → Drafter (draft)
 * Uses GOOGLE_APPLICATION_CREDENTIALS or default credentials (e.g. gcloud auth application-default login).
 */

import { GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { AI_CONFIG, AI_POST_LIMITS, AI_PROMPTS, AI_RESPONSE_SCHEMA, AI_SAFETY_SETTINGS } from "../constants";
import { DEFAULT_VALUES } from "../constants/defaultValues";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";
import { loadGoogleServiceAccountCredentials } from "../utils/googleCredentials";
import { sanitizeJsonString } from "../utils/sanitizeJson";

let cachedGoogleGenAI: GoogleGenAI | null = null;

function getModelName(): string {
  return config.googleAiModel;
}

function getConfiguredLocation(): string {
  return (
    config.googleCloudLocation || process.env.GOOGLE_CLOUD_LOCATION || DEFAULT_VALUES.DEFAULT_GOOGLE_CLOUD_LOCATION
  );
}

function getAiRuntimeConfig() {
  const model = getModelName();
  const configuredLocation = getConfiguredLocation();
  const location = resolveVertexLocation(configuredLocation, model);
  const project = config.googleCloudProject || process.env.GOOGLE_CLOUD_PROJECT || "";
  return { model, configuredLocation, location, project };
}

function resolveVertexLocation(configuredLocation: string, modelName: string): string {
  const multiRegion = new Set(["global", "us", "eu"]);
  if (multiRegion.has(configuredLocation)) return configuredLocation;

  const needsGlobal = AI_CONFIG.VERTEX_GLOBAL_MODEL_PREFIXES.some((prefix) => modelName.startsWith(prefix));
  return needsGlobal ? AI_CONFIG.VERTEX_GLOBAL_FALLBACK_LOCATION : configuredLocation;
}

function getGoogleGenAI(): GoogleGenAI {
  if (cachedGoogleGenAI) return cachedGoogleGenAI;

  let project = config.googleCloudProject || process.env.GOOGLE_CLOUD_PROJECT;
  const { configuredLocation, location } = getAiRuntimeConfig();

  const credentialsObj = loadGoogleServiceAccountCredentials();
  if (credentialsObj?.project_id && !project) {
    project = credentialsObj.project_id;
  }

  if (!project || project.trim() === "") {
    throw new AppError(ERROR_MESSAGES.VERTEX_AI_PROJECT_MISSING, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  const opts: any = {
    vertexai: true,
    project,
    location,
  };

  if (credentialsObj) {
    opts.googleAuthOptions = { credentials: credentialsObj };
  }

  cachedGoogleGenAI = new GoogleGenAI(opts);
  return cachedGoogleGenAI;
}

function getText(result: GenerateContentResponse): string {
  const text = result.text;
  if (!text) {
    throw new Error(ERROR_MESSAGES.AI_EMPTY_RESPONSE);
  }
  return text.trim();
}

/** Merge generation config; disable Flash thinking so maxOutputTokens go to visible output. */
function buildGeminiConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const generationConfig: Record<string, unknown> = {
    ...overrides,
    safetySettings: AI_SAFETY_SETTINGS,
  };
  const model = getModelName();
  if (/flash/i.test(model) && AI_CONFIG.FLASH_THINKING_BUDGET === 0) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  return generationConfig;
}

function toBase64DataUrl(bytes: string | Uint8Array | Buffer, mime = "image/png"): string {
  const base64 = typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("base64");
  return `data:${mime};base64,${base64}`;
}

/** Normalize Vertex AI 403 (API not enabled or billing disabled) into a clear message for the client. */
function normalizeVertexError(err: Error & { status?: number; details?: unknown }, fallbackMessage: string): never {
  if (err instanceof AppError) throw err;
  const msg = err.message || "";
  const is403 = msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("Forbidden");
  const is404 = msg.includes("404") || msg.includes("NOT_FOUND");
  const project = config.googleCloudProject || process.env.GOOGLE_CLOUD_PROJECT;

  if (is403 && (msg.includes("BILLING_DISABLED") || msg.includes("billing to be enabled"))) {
    const billingUrl = project
      ? `https://console.cloud.google.com/billing/enable?project=${project}`
      : ERROR_MESSAGES.VERTEX_AI_BILLING_ENABLE_URL;
    throw new AppError(
      `${ERROR_MESSAGES.VERTEX_AI_BILLING_DISABLED} Enable billing here: ${billingUrl}`,
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

  if (is404 && (msg.includes("/publishers/google/models/") || msg.includes("Publisher Model"))) {
    throw new AppError(ERROR_MESSAGES.VERTEX_AI_MODEL_NOT_FOUND, HTTP_STATUS.BAD_REQUEST);
  }

  const is429 = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Resource exhausted");
  if (is429) {
    throw new AppError(ERROR_MESSAGES.AI_IMAGE_RATE_LIMITED, HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  throw new AppError(err.message || fallbackMessage, err.status ?? HTTP_STATUS.BAD_GATEWAY, err.details);
}

import { GeneratePostResult } from "../types";

function normalizeTags(tags: string[] | undefined): string[] {
  return (tags || [])
    .map((tag) => tag.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, ""))
    .filter(Boolean)
    .slice(0, AI_POST_LIMITS.TAG_COUNT);
}

function parseJSONContent(rawText: string): GeneratePostResult {
  // Helper to map a parsed object to the result shape
  const toResult = (parsed: Record<string, unknown>): GeneratePostResult => ({
    title: (parsed.title as string) || "",
    meta_description: (parsed.meta_description as string) || "",
    tags: normalizeTags(Array.isArray(parsed.tags) ? (parsed.tags as string[]) : []),
    content: (parsed.content_markdown as string) || "",
  });

  // Strip markdown code fences (handles trailing newlines, plain ``` or ```json)
  const stripped = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  // Attempt 1: direct parse (works when model returns clean JSON)
  try {
    return toResult(JSON.parse(stripped));
  } catch {
    // ignore – try sanitized parse below
  }

  // Attempt 2: sanitize literal control characters inside JSON strings, then parse
  try {
    return toResult(JSON.parse(sanitizeJsonString(stripped)));
  } catch {
    // ignore
  }

  // Attempt 3: extract the first {...} block and sanitize
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return toResult(JSON.parse(sanitizeJsonString(jsonMatch[0])));
    } catch {
      // ignore
    }
  }

  // Last resort: return raw text as content so the user at least sees something
  return { title: "", meta_description: "", tags: [], content: rawText };
}

/**
 * Generate full post in a single pass (including trending keywords research)
 */
export async function generatePost(keyword: string): Promise<GeneratePostResult> {
  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_KEYWORD_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  const ai = getGoogleGenAI();
  const modelName = getModelName();
  const userMessage = AI_PROMPTS.FULL_POST_USER(keyword.trim());

  // Google Search grounding path
  if (config.aiUseGoogleSearchRetrieval) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: userMessage,
        safetySettings: AI_SAFETY_SETTINGS,
        safety_settings: AI_SAFETY_SETTINGS,
        config: buildGeminiConfig({
          systemInstruction: AI_PROMPTS.FULL_POST_SYSTEM,
          maxOutputTokens: AI_CONFIG.MAX_DRAFT_TOKENS,
          responseMimeType: "application/json",
          responseSchema: AI_RESPONSE_SCHEMA,
          tools: [{ googleSearch: {} }],
        }),
      } as any);
      const parsed = parseJSONContent(getText(result));
      // Only use grounded result if parsing actually extracted structured fields
      if (parsed.title && parsed.content) return parsed;
      // Otherwise fall through to standard model
    } catch {
      // Google Search grounding not enabled – fall through to standard model below.
    }
  }

  // Standard (non-grounded) path
  try {
    const result = await ai.models.generateContent({
      model: modelName,
      contents: userMessage,
      safetySettings: AI_SAFETY_SETTINGS,
      safety_settings: AI_SAFETY_SETTINGS,
      config: buildGeminiConfig({
        systemInstruction: AI_PROMPTS.FULL_POST_SYSTEM,
        maxOutputTokens: AI_CONFIG.MAX_DRAFT_TOKENS,
        responseMimeType: "application/json",
        responseSchema: AI_RESPONSE_SCHEMA,
      }),
    } as any);
    return parseJSONContent(getText(result));
  } catch (err) {
    return normalizeVertexError(err as Error & { status?: number; details?: unknown }, ERROR_MESSAGES.AI_DRAFT_FAILED);
  }
}

/**
 * Build a short image prompt from a blog topic using Gemini
 */
async function generateImagePromptFromTopic(topic: string, additionalPrompt?: string): Promise<string> {
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_KEYWORD_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }
  try {
    const ai = getGoogleGenAI();
    const modelName = getModelName();
    const result = await ai.models.generateContent({
      model: modelName,
      contents: AI_PROMPTS.IMAGE_FROM_TOPIC_USER(topic.trim(), additionalPrompt),
      safetySettings: AI_SAFETY_SETTINGS,
      safety_settings: AI_SAFETY_SETTINGS,
      config: buildGeminiConfig({
        systemInstruction: AI_PROMPTS.IMAGE_FROM_TOPIC_SYSTEM,
        maxOutputTokens: AI_CONFIG.MAX_IMAGE_PROMPT_TOKENS,
      }),
    } as any);
    return getText(result);
  } catch (err) {
    return normalizeVertexError(err as Error & { status?: number; details?: unknown }, ERROR_MESSAGES.AI_IMAGE_FAILED);
  }
}

/**
 * Generate a featured image from a blog topic: Gemini builds prompt, then Imagen.
 */
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

  try {
    const ai = getGoogleGenAI();
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

/**
 * Handle inline editing tasks (proofread, adjust, comment, add paragraph)
 */
export async function generateEdit(action: string, contextText: string): Promise<string> {
  if (!contextText || typeof contextText !== "string" || !contextText.trim()) {
    throw new AppError("Context text is required for AI edit actions", HTTP_STATUS.BAD_REQUEST);
  }
  try {
    const ai = getGoogleGenAI();
    const modelName = getModelName();
    const result = await ai.models.generateContent({
      model: modelName,
      contents: AI_PROMPTS.EDITOR_TOOL_USER(action, contextText.trim()),
      safetySettings: AI_SAFETY_SETTINGS,
      safety_settings: AI_SAFETY_SETTINGS,
      config: buildGeminiConfig({
        systemInstruction: AI_PROMPTS.EDITOR_TOOL_SYSTEM,
        maxOutputTokens: AI_CONFIG.MAX_DRAFT_TOKENS,
      }),
    } as any);
    return getText(result);
  } catch (err) {
    return normalizeVertexError(err as Error & { status?: number; details?: unknown }, ERROR_MESSAGES.AI_EDIT_FAILED);
  }
}
