/**
 * AI Featured Image Generation
 * Primary: Gemini multimodal image models on Vertex AI (preferred) or Studio fallback.
 * Imagen is not used (deprecated on Vertex as of 2026-06-30).
 * Configured for 16:9 blog headers.
 * Generated covers are always returned as PNG data URLs (no GCS upload on generate).
 */

import {
  AI_CONFIG,
  AI_IMAGE_SOURCES,
  AI_POST_LIMITS,
  AI_PROMPTS,
  AI_PROVIDERS,
} from "@constants";
import { AppError } from "@middleware/errorHandler";
import type { GenerateImageResult, ImageSource } from "@types";
import { logger } from "@utils/logger";
import sharp from "sharp";

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

function toPngDataUrl(pngBytes: Buffer): string {
  return `data:${AI_CONFIG.IMAGE_MIME_PNG};base64,${pngBytes.toString("base64")}`;
}

/**
 * Decode Gemini inline image bytes and re-encode as PNG so clients always
 * receive `data:image/png;base64,...` regardless of source mime (WebP, JPEG, etc.).
 */
async function convertInlineImageToPngDataUrl(base64Data: string, sourceMime?: string): Promise<string | null> {
  try {
    const input = Buffer.from(base64Data, "base64");
    const pngBytes = await sharp(input)
      .png({ compressionLevel: AI_CONFIG.IMAGE_PNG_COMPRESSION_LEVEL })
      .toBuffer();
    if (sourceMime && sourceMime.toLowerCase() !== AI_CONFIG.IMAGE_MIME_PNG) {
      logger.info(`AI cover converted from ${sourceMime} to ${AI_CONFIG.IMAGE_MIME_PNG}`);
    }
    return toPngDataUrl(pngBytes);
  } catch (err) {
    logger.warn(
      `AI cover PNG conversion failed: ${(err as Error).message.slice(0, AI_CONFIG.IMAGE_ERROR_LOG_MAX_CHARS)}`,
    );
    return null;
  }
}

async function extractInlineImage(result: Record<string, unknown>): Promise<string | null> {
  const candidates = result.candidates as Array<{ content?: { parts?: Array<Record<string, unknown>> } }> | undefined;
  const parts = candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const inline = (part.inlineData || part.inline_data) as
      | { data?: string; mimeType?: string; mime_type?: string }
      | undefined;
    if (inline?.data) {
      const sourceMime = inline.mimeType || inline.mime_type;
      const dataUrl = await convertInlineImageToPngDataUrl(inline.data, sourceMime);
      if (dataUrl) {
        return dataUrl;
      }
    }
  }
  return null;
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
    const dataUrl = await extractInlineImage(res as unknown as Record<string, unknown>);
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
 * Returns a client-local PNG data URL only — GCS upload happens on explicit
 * attach (`PUT /api/posts/:id/cover`), manual presigned upload, or save-time
 * base64 cover processing — not during generate.
 */
export async function generateImageFromTopic(topic: string, additionalPrompt?: string): Promise<GenerateImageResult> {
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_KEYWORD_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  const prompt = (additionalPrompt?.trim() || (await generatePrompt(topic, additionalPrompt))).trim();

  const imageData = await tryGeminiImageModels(prompt);
  if (imageData) {
    return { imageDataUrl: imageData, source: AI_IMAGE_SOURCES.GEMINI };
  }

  throw new AppError(
    `${ERROR_MESSAGES.AI_IMAGE_FAILED}${ERROR_MESSAGES.AI_IMAGE_UNAVAILABLE_DETAIL}`,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
  );
}
