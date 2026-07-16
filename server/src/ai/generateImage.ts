/**
 * Featured image generation via Google AI Studio.
 * Tries Gemini native image / Imagen, then SVG cover if quota or model is unavailable.
 */
import { AI_CONFIG, AI_PROMPTS } from "../constants";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";
import { buildModelCandidates, getAiClient, getModelName, getText, studioGenerateContent } from "./client";
import { isFallbackWorthyError, normalizeAiError } from "./errors";
import { withRetry } from "./retries";

function toBase64DataUrl(bytes: string | Uint8Array | Buffer, mime = "image/png"): string {
  const base64 = typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("base64");
  return `data:${mime};base64,${base64}`;
}

function escapeSvgText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function hashString(value: string): number {
  return [...value].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}

function buildFallbackSvgCover(topic: string, imagePrompt: string): string {
  const cleanTopic = escapeSvgText(topic.trim().slice(0, 90) || "Generated cover image");
  const cleanPrompt = escapeSvgText(imagePrompt.trim().slice(0, 150));
  const hue = hashString(topic) % 360;
  const hue2 = (hue + 52) % 360;
  const hue3 = (hue + 122) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="420" viewBox="0 0 1000 420" role="img" aria-label="${cleanTopic}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, 76%, 22%)"/>
      <stop offset="52%" stop-color="hsl(${hue2}, 72%, 30%)"/>
      <stop offset="100%" stop-color="hsl(${hue3}, 80%, 18%)"/>
    </linearGradient>
    <radialGradient id="glow" cx="72%" cy="20%" r="68%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.42)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="32"/></filter>
  </defs>
  <rect width="1000" height="420" fill="url(#bg)"/>
  <circle cx="760" cy="88" r="180" fill="url(#glow)"/>
  <circle cx="140" cy="360" r="140" fill="hsl(${hue3}, 90%, 62%)" opacity="0.25" filter="url(#blur)"/>
  <path d="M0 312 C160 250 260 398 430 314 S720 210 1000 300 V420 H0 Z" fill="rgba(255,255,255,0.11)"/>
  <g fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2">
    <path d="M720 96h96v96h-96z"/>
    <path d="M742 144h52M768 118v52"/>
    <circle cx="852" cy="154" r="44"/>
  </g>
  <text x="72" y="88" fill="rgba(255,255,255,0.74)" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">SYNCAPP AI COVER</text>
  <foreignObject x="70" y="126" width="700" height="150">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, Arial, sans-serif; color: white; font-size: 50px; line-height: 1.08; font-weight: 800; letter-spacing: -1.5px;">${cleanTopic}</div>
  </foreignObject>
  <foreignObject x="72" y="294" width="760" height="70">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, Arial, sans-serif; color: rgba(255,255,255,0.78); font-size: 18px; line-height: 1.45;">${cleanPrompt}</div>
  </foreignObject>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function extractInlineImage(result: {
  candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>;
}): string | null {
  const parts = result.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const data = part.inlineData?.data;
    if (data) {
      return toBase64DataUrl(data, part.inlineData?.mimeType || "image/png");
    }
  }
  return null;
}

async function generateImagePromptFromTopic(topic: string, additionalPrompt?: string): Promise<string> {
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_KEYWORD_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  const candidates = buildModelCandidates(getModelName());
  let lastError: unknown;

  for (const modelName of candidates) {
    try {
      const result = await withRetry(() =>
        studioGenerateContent({
          model: modelName,
          contents: AI_PROMPTS.IMAGE_FROM_TOPIC_USER(topic.trim(), additionalPrompt),
          systemInstruction: AI_PROMPTS.IMAGE_FROM_TOPIC_SYSTEM,
          maxOutputTokens: AI_CONFIG.MAX_IMAGE_PROMPT_TOKENS,
          temperature: AI_CONFIG.TEMPERATURE_EDIT,
        }),
      );
      return getText(result);
    } catch (err) {
      lastError = err;
      if (!isFallbackWorthyError(err)) {
        return normalizeAiError(err as Error & { status?: number; details?: unknown }, ERROR_MESSAGES.AI_IMAGE_FAILED);
      }
    }
  }

  return normalizeAiError(
    (lastError as Error & { status?: number; details?: unknown }) || new Error(ERROR_MESSAGES.AI_IMAGE_FAILED),
    ERROR_MESSAGES.AI_IMAGE_FAILED,
  );
}

async function tryGeminiNativeImage(prompt: string): Promise<string | null> {
  const ai = getAiClient();
  const models = [process.env.GEMINI_IMAGE_MODEL?.trim(), ...AI_CONFIG.IMAGE_MODEL_FALLBACKS].filter(
    (m): m is string => typeof m === "string" && m.length > 0 && !m.startsWith("imagen"),
  );

  for (const model of [...new Set(models)]) {
    try {
      const result = await withRetry(
        () =>
          ai.models.generateContent({
            model,
            contents: `Create a high-CTR 16:9 blog featured image. ${prompt}`,
            config: {
              responseModalities: ["TEXT", "IMAGE"],
              temperature: 0.8,
            },
          } as never),
        { attempts: 1 },
      );
      const dataUrl = extractInlineImage(result as never);
      if (dataUrl) return dataUrl;
    } catch {
      // try next image model
    }
  }
  return null;
}

async function tryImagen(prompt: string): Promise<string | null> {
  const ai = getAiClient();
  const models = [
    process.env.IMAGEN_MODEL?.trim(),
    AI_CONFIG.IMAGEN_MODEL,
    ...AI_CONFIG.IMAGE_MODEL_FALLBACKS.filter((m) => m.startsWith("imagen")),
  ].filter(Boolean) as string[];

  for (const model of [...new Set(models)]) {
    try {
      const response = await withRetry(
        () =>
          ai.models.generateImages({
            model,
            prompt,
            config: { numberOfImages: 1, aspectRatio: "16:9" },
          }),
        { attempts: 1 },
      );
      const img = response?.generatedImages?.[0]?.image;
      if (img?.imageBytes) {
        return toBase64DataUrl(img.imageBytes, img.mimeType || "image/png");
      }
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Generate a featured image: prompt via text model, then Gemini image / Imagen / SVG fallback.
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

  const prompt = imagePrompt.trim();
  const native = await tryGeminiNativeImage(prompt);
  if (native) return { imageDataUrl: native };

  const imagen = await tryImagen(prompt);
  if (imagen) return { imageDataUrl: imagen };

  // Free-tier keys often lack image quota — still return a usable branded cover.
  return { imageDataUrl: buildFallbackSvgCover(topic, prompt) };
}
