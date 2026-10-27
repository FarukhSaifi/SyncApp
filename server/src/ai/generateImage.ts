/**
 * AI Featured Image Generation
 * Primary: Gemini multimodal image models on Vertex AI (preferred) or Studio fallback.
 * Imagen is not used (deprecated on Vertex as of 2026-06-30).
 * Configured for 16:9 blog headers.
 */

import {
  AI_CONFIG,
  AI_IMAGE_SOURCES,
  AI_POST_LIMITS,
  AI_PROMPTS,
  AI_PROVIDERS,
  DEFAULT_VALUES,
  REGEX_PATTERNS,
} from "@constants";
import { AppError } from "@middleware/errorHandler";
import { uploadToGCS } from "@services/storage";
import type { GenerateImageResult, ImageSource } from "@types";
import { logger } from "@utils/logger";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

import {
  buildModelCandidates,
  generateAiContent,
  getAiClient,
  getModelName,
  getText,
  resolveAiProvider,
} from "./client";
import { isFallbackWorthyError, normalizeAiError } from "./errors";
import { withRetry } from "./retries";

export type { GenerateImageResult, ImageSource };

function toBase64DataUrl(bytes: string | Uint8Array | Buffer, mime: string = AI_CONFIG.IMAGE_MIME_PNG): string {
  const base64 = typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("base64");
  return `data:${mime};base64,${base64}`;
}

function extractInlineImage(result: Record<string, unknown>): string | null {
  const candidates = result.candidates as Array<{ content?: { parts?: Array<Record<string, unknown>> } }> | undefined;
  const parts = candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const inline = (part.inlineData || part.inline_data) as
      | { data?: string; mimeType?: string; mime_type?: string }
      | undefined;
    if (inline?.data) {
      return toBase64DataUrl(inline.data, inline.mimeType || inline.mime_type || AI_CONFIG.IMAGE_MIME_PNG);
    }
  }
  return null;
}

/**
 * Persist generated image to cloud storage in background so it has a permanent public URL.
 */
async function persistImage(dataUrl: string, topic: string): Promise<string | undefined> {
  try {
    const match = dataUrl.match(REGEX_PATTERNS["DATA_URL_BASE64"]);
    if (!match) {
      return undefined;
    }
    const mimetype = match[1];
    const buffer = Buffer.from(match[2], "base64");
    const slug = topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, DEFAULT_VALUES.STORAGE_SLUG_MAX_LENGTH);
    const ext = mimetype.split("/")[1]?.replace("+xml", "") || "png";
    const filename = `ai-cover-${slug}-${Date.now()}.${ext}`;
    return await uploadToGCS(buffer, filename, mimetype, false);
  } catch (err) {
    logger.warn(`Storage persistence skipped: ${(err as Error).message}`);
    return undefined;
  }
}

/**
 * Generate an image prompt optimized for high-CTR blog featured headers.
 */
async function generatePrompt(topic: string, userInstruction?: string): Promise<string> {
  const candidates = buildModelCandidates(getModelName());
  let lastErr: unknown;

  for (const model of candidates) {
    try {
      const result = await withRetry(() =>
        generateAiContent({
          model,
          contents: AI_PROMPTS.IMAGE_FROM_TOPIC_USER(topic.trim(), userInstruction),
          systemInstruction: AI_PROMPTS.IMAGE_FROM_TOPIC_SYSTEM,
          maxOutputTokens: AI_CONFIG.MAX_IMAGE_PROMPT_TOKENS,
          temperature: AI_CONFIG.TEMPERATURE_EDIT,
        }),
      );
      return getText(result);
    } catch (err) {
      lastErr = err;
      if (!isFallbackWorthyError(err)) {
        break;
      }
    }
  }

  return normalizeAiError(
    (lastErr as Error & { status?: number }) || new Error(ERROR_MESSAGES.AI_IMAGE_FAILED),
    ERROR_MESSAGES.AI_IMAGE_FAILED,
  );
}

function imageModelCandidates(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const model of [AI_CONFIG.IMAGE_MODEL, ...AI_CONFIG.IMAGE_MODEL_FALLBACKS]) {
    if (model.startsWith(AI_CONFIG.IMAGEN_MODEL_PREFIX)) {
      continue;
    }
    if (seen.has(model)) {
      continue;
    }
    seen.add(model);
    out.push(model);
  }
  return out;
}

/**
 * Try generating an image with Gemini multimodal image models (Vertex or Studio client).
 */
async function tryGeminiImageModel(model: string, prompt: string, providerLabel: string): Promise<string | null> {
  const formattedPrompt = `Create a high-CTR 16:9 (${AI_POST_LIMITS.COVER_WIDTH}×${AI_POST_LIMITS.COVER_HEIGHT}) blog featured image. Clean, modern developer aesthetic, no watermarks, no UI chrome. ${prompt}`;
  try {
    const ai = getAiClient();
    const res = await withRetry(
      () =>
        ai.models.generateContent({
          model,
          contents: formattedPrompt,
          config: {
            responseModalities: [AI_CONFIG.RESPONSE_MODALITY_TEXT, AI_CONFIG.RESPONSE_MODALITY_IMAGE],
            temperature: AI_CONFIG.TEMPERATURE_IMAGE,
          },
        }),
      { attempts: AI_CONFIG.RETRY_ATTEMPTS_ONCE },
    );
    const dataUrl = extractInlineImage(res as unknown as Record<string, unknown>);
    if (dataUrl) {
      logger.info(`AI image generated via ${providerLabel} (${model})`);
      return dataUrl;
    }
  } catch (err) {
    logger.warn(
      `${providerLabel} (${model}) failed: ${(err as Error).message.slice(0, AI_CONFIG.IMAGE_ERROR_LOG_MAX_CHARS)}`,
    );
  }
  return null;
}

async function tryGeminiImageModels(prompt: string): Promise<string | null> {
  const provider = resolveAiProvider();
  const providerLabel =
    provider === AI_PROVIDERS.VERTEX ? AI_CONFIG.PROVIDER_LABEL_VERTEX_GEMINI : AI_CONFIG.PROVIDER_LABEL_STUDIO_GEMINI;
  for (const model of imageModelCandidates()) {
    const result = await tryGeminiImageModel(model, prompt, providerLabel);
    if (result) {
      return result;
    }
  }
  return null;
}

/**
 * Main entry point: generate a 16:9 featured blog image from topic.
 */
export async function generateImageFromTopic(topic: string, additionalPrompt?: string): Promise<GenerateImageResult> {
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_KEYWORD_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  const prompt = (additionalPrompt?.trim() || (await generatePrompt(topic, additionalPrompt))).trim();

  const imageData = await tryGeminiImageModels(prompt);
  if (imageData) {
    const publicUrl = await persistImage(imageData, topic);
    return { imageDataUrl: imageData, imageUrl: publicUrl, source: AI_IMAGE_SOURCES.GEMINI };
  }

  throw new AppError(
    `${ERROR_MESSAGES.AI_IMAGE_FAILED}${ERROR_MESSAGES.AI_IMAGE_UNAVAILABLE_DETAIL}`,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
  );
}
