/**
 * AI Featured Image Generation
 * Uses real AI models (Gemini 2.5 Flash Image & Imagen) configured for 16:9 blog headers.
 * Clean, minimal, and fully maintainable pipeline.
 */
import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG, AI_POST_LIMITS, AI_PROMPTS } from "../constants";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import {
  buildModelCandidates,
  getAiClient,
  getModelName,
  getText,
  getVertexAiClient,
  hasVertexConfig,
  studioGenerateContent,
} from "./client";
import { uploadToGCS } from "../services/storage";
import { isFallbackWorthyError, normalizeAiError } from "./errors";
import { withRetry } from "./retries";

export type ImageSource = "gemini" | "imagen";

export interface GenerateImageResult {
  imageDataUrl: string;
  imageUrl?: string;
  source: ImageSource;
}

function toBase64DataUrl(bytes: string | Uint8Array | Buffer, mime = "image/png"): string {
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
      return toBase64DataUrl(inline.data, inline.mimeType || inline.mime_type || "image/png");
    }
  }
  return null;
}

/**
 * Persist generated image to cloud storage in background so it has a permanent public URL.
 */
async function persistImage(dataUrl: string, topic: string): Promise<string | undefined> {
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return undefined;
    const mimetype = match[1];
    const buffer = Buffer.from(match[2], "base64");
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 35);
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
        studioGenerateContent({
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
      if (!isFallbackWorthyError(err)) break;
    }
  }

  return normalizeAiError(
    (lastErr as Error & { status?: number }) || new Error(ERROR_MESSAGES.AI_IMAGE_FAILED),
    ERROR_MESSAGES.AI_IMAGE_FAILED,
  );
}

/**
 * Try generating an image with a GoogleGenAI client (Vertex or Studio) and Gemini multimodal model.
 */
async function tryGeminiModel(
  client: GoogleGenAI,
  model: string,
  prompt: string,
  providerLabel: string,
): Promise<string | null> {
  const formattedPrompt = `Create a high-CTR 16:9 (${AI_POST_LIMITS.COVER_WIDTH}×${AI_POST_LIMITS.COVER_HEIGHT}) blog featured image. Clean, modern developer aesthetic, no watermarks, no UI chrome. ${prompt}`;
  try {
    const res = await withRetry(
      () =>
        client.models.generateContent({
          model,
          contents: formattedPrompt,
          config: { responseModalities: ["TEXT", "IMAGE"], temperature: 0.8 },
        }),
      { attempts: 1 },
    );
    const dataUrl = extractInlineImage(res as unknown as Record<string, unknown>);
    if (dataUrl) {
      logger.info(`AI image generated via ${providerLabel} (${model})`);
      return dataUrl;
    }
  } catch (err) {
    logger.warn(`${providerLabel} (${model}) failed: ${(err as Error).message.slice(0, 150)}`);
  }
  return null;
}

/**
 * Try generating image via Google Cloud Vertex AI (billed GCP quota).
 */
async function tryVertex(prompt: string): Promise<string | null> {
  if (!hasVertexConfig()) return null;
  const client = getVertexAiClient();
  if (!client) return null;

  const models = [AI_CONFIG.IMAGE_MODEL, "gemini-2.5-flash-image"];
  for (const model of models) {
    const result = await tryGeminiModel(client, model, prompt, "Vertex AI");
    if (result) return result;
  }
  return null;
}

/**
 * Try generating image via Google AI Studio Gemini multimodal models.
 */
async function tryStudioGemini(prompt: string): Promise<string | null> {
  const ai = getAiClient();
  const models = [
    AI_CONFIG.IMAGE_MODEL,
    ...AI_CONFIG.IMAGE_MODEL_FALLBACKS.filter((m) => !m.startsWith("imagen")),
  ];

  for (const model of models) {
    const result = await tryGeminiModel(ai, model, prompt, "AI Studio Gemini");
    if (result) return result;
  }
  return null;
}

/**
 * Try generating image via Imagen models (16:9 aspect ratio).
 */
async function tryImagen(prompt: string): Promise<string | null> {
  const ai = getAiClient();
  const models = [
    "imagen-4.0-fast-generate-001",
    "imagen-3.0-generate-002",
    ...AI_CONFIG.IMAGE_MODEL_FALLBACKS.filter((m) => m.startsWith("imagen")),
  ];

  for (const model of models) {
    try {
      const res = await withRetry(
        () =>
          ai.models.generateImages({
            model,
            prompt,
            config: { numberOfImages: 1, aspectRatio: "16:9" },
          }),
        { attempts: 1 },
      );
      const img = res?.generatedImages?.[0]?.image;
      if (img?.imageBytes) {
        logger.info(`AI image generated via Imagen (${model})`);
        return toBase64DataUrl(img.imageBytes, img.mimeType || "image/png");
      }
    } catch (err) {
      logger.warn(`Imagen (${model}) failed: ${(err as Error).message.slice(0, 150)}`);
    }
  }
  return null;
}

/**
 * Main entry point: generate a 16:9 featured blog image from topic.
 */
export async function generateImageFromTopic(
  topic: string,
  additionalPrompt?: string,
): Promise<GenerateImageResult> {
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_KEYWORD_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  const prompt = (
    additionalPrompt?.trim() || (await generatePrompt(topic, additionalPrompt))
  ).trim();

  // 1. Vertex AI (Primary with Google Cloud billing)
  const vertexData = await tryVertex(prompt);
  if (vertexData) {
    const publicUrl = await persistImage(vertexData, topic);
    return { imageDataUrl: vertexData, imageUrl: publicUrl, source: "gemini" };
  }

  // 2. Google AI Studio (Multimodal Gemini)
  const studioData = await tryStudioGemini(prompt);
  if (studioData) {
    const publicUrl = await persistImage(studioData, topic);
    return { imageDataUrl: studioData, imageUrl: publicUrl, source: "gemini" };
  }

  // 3. Google AI Studio (Imagen)
  const imagenData = await tryImagen(prompt);
  if (imagenData) {
    const publicUrl = await persistImage(imagenData, topic);
    return { imageDataUrl: imagenData, imageUrl: publicUrl, source: "imagen" };
  }

  throw new AppError(
    `${ERROR_MESSAGES.AI_IMAGE_FAILED} — AI image models are temporarily unavailable or rate limited. Please retry shortly.`,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
  );
}
