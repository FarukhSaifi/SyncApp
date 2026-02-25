/**
 * AI Service – Google Vertex AI (Gemini) for outline and draft; optional Imagen for featured image
 * Steps: SEO Analyst (outline) → Drafter (draft)
 * Uses GOOGLE_APPLICATION_CREDENTIALS or default credentials (e.g. gcloud auth application-default login).
 */

import { VertexAI } from "@google-cloud/vertexai";
import axios from "axios";
import { GoogleAuth } from "google-auth-library";
import { config } from "../config";
import { AI_CONFIG, AI_PROMPTS } from "../constants";
import { DEFAULT_VALUES } from "../constants/defaultValues";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";

function getVertexAI(): VertexAI {
  const project = config.googleCloudProject || process.env.GOOGLE_CLOUD_PROJECT;
  const location =
    config.googleCloudLocation || process.env.GOOGLE_CLOUD_LOCATION || DEFAULT_VALUES.DEFAULT_GOOGLE_CLOUD_LOCATION;
  if (!project || project.trim() === "") {
    throw new AppError(ERROR_MESSAGES.VERTEX_AI_PROJECT_MISSING, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }
  const opts: ConstructorParameters<typeof VertexAI>[0] = { project, location };
  if (config.googleApplicationCredentials) {
    (opts as Record<string, unknown>).googleAuthOptions = { keyFilename: config.googleApplicationCredentials };
  }
  return new VertexAI(opts);
}

function getBaseModel() {
  const vertexAI = getVertexAI();
  const modelName = process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || AI_CONFIG.DEFAULT_MODEL;
  return vertexAI.getGenerativeModel({
    model: modelName,
    generationConfig: { maxOutputTokens: AI_CONFIG.MAX_DRAFT_TOKENS },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractText(result: any): string {
  const response = result.response;
  if (!response?.candidates?.length) {
    throw new Error(ERROR_MESSAGES.AI_EMPTY_OR_BLOCKED_RESPONSE);
  }
  const parts = response.candidates[0].content?.parts;
  if (!parts?.length || !parts[0].text) {
    throw new Error(ERROR_MESSAGES.AI_EMPTY_RESPONSE);
  }
  return parts[0].text.trim() as string;
}

/** Normalize Vertex AI 403 (API not enabled or billing disabled) into a clear message for the client. */
function normalizeVertexError(err: unknown, fallbackMessage: string): never {
  if (err instanceof AppError) throw err;
  const error = err as Error & { status?: number; details?: unknown };
  const msg = error.message || "";
  const is403 = msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("Forbidden");
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

  throw new AppError(error.message || fallbackMessage, error.status || HTTP_STATUS.BAD_GATEWAY, error.details);
}

/**
 * Step 1: SEO Analyst – generate outline from keyword (optional: Google Search grounding for SEO)
 */
export async function generateOutline(keyword: string): Promise<string> {
  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_KEYWORD_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }
  try {
    const vertexAI = getVertexAI();
    const modelName = process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || AI_CONFIG.DEFAULT_MODEL;
    const useGoogleSearch = config.aiUseGoogleSearchRetrieval !== false;
    const userMessage = AI_PROMPTS.SEO_ANALYST_USER(keyword.trim());

    if (useGoogleSearch) {
      const generativeModel = vertexAI.preview.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: AI_CONFIG.MAX_OUTLINE_TOKENS },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ googleSearch: {} } as any],
      });
      const result = await generativeModel.generateContent({
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        systemInstruction: AI_PROMPTS.SEO_ANALYST_SYSTEM,
      });
      return extractText(result);
    }

    const generativeModel = vertexAI.getGenerativeModel({
      model: modelName,
      generationConfig: { maxOutputTokens: AI_CONFIG.MAX_OUTLINE_TOKENS },
    });
    const result = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      systemInstruction: AI_PROMPTS.SEO_ANALYST_SYSTEM,
    });
    return extractText(result);
  } catch (err) {
    normalizeVertexError(err, ERROR_MESSAGES.AI_OUTLINE_FAILED);
  }
}

/**
 * Step 2: Drafter – write full content from an outline
 */
export async function generateDraft(outline: string): Promise<string> {
  if (!outline || typeof outline !== "string" || !outline.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_OUTLINE_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }
  try {
    const model = getBaseModel();
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: AI_PROMPTS.DRAFTER_USER(outline.trim()) }],
        },
      ],
      systemInstruction: AI_PROMPTS.DRAFTER_SYSTEM(outline.trim()),
      generationConfig: { maxOutputTokens: AI_CONFIG.MAX_DRAFT_TOKENS },
    });
    return extractText(result);
  } catch (err) {
    normalizeVertexError(err, ERROR_MESSAGES.AI_DRAFT_FAILED);
  }
}

/**
 * Full flow: outline → draft (no humor step)
 */
export async function generatePost(keyword: string): Promise<{ outline: string; draft: string; content: string }> {
  const outline = await generateOutline(keyword);
  const draft = await generateDraft(outline);
  return {
    outline,
    draft,
    content: draft,
  };
}

/** Placeholder featured image (SVG) when Imagen is not available or fails */
function placeholderFeaturedImageDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect fill="%23f0f0f0" width="800" height="450"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23666">Featured image – generate with AI when Imagen is enabled</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Build a short image prompt from a blog outline using Gemini
 */
export async function generateImagePromptFromOutline(outline: string): Promise<string> {
  if (!outline || typeof outline !== "string" || !outline.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_OUTLINE_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }
  try {
    const vertexAI = getVertexAI();
    const modelName = process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || AI_CONFIG.DEFAULT_MODEL;
    const model = vertexAI.getGenerativeModel({
      model: modelName,
      generationConfig: { maxOutputTokens: AI_CONFIG.MAX_IMAGE_PROMPT_TOKENS },
    });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: AI_PROMPTS.IMAGE_FROM_OUTLINE_USER(outline.trim()) }] }],
      systemInstruction: AI_PROMPTS.IMAGE_FROM_OUTLINE_SYSTEM,
    });
    return extractText(result);
  } catch (err) {
    normalizeVertexError(err, ERROR_MESSAGES.AI_IMAGE_FAILED);
  }
}

/**
 * Generate a featured image from a blog outline: Gemini builds prompt, then Imagen (or placeholder)
 */
export async function generateImageFromOutline(outline: string): Promise<{ imageDataUrl: string }> {
  const project = config.googleCloudProject || process.env.GOOGLE_CLOUD_PROJECT;
  const location =
    config.googleCloudLocation || process.env.GOOGLE_CLOUD_LOCATION || DEFAULT_VALUES.DEFAULT_GOOGLE_CLOUD_LOCATION;

  const imagePrompt = await generateImagePromptFromOutline(outline);

  try {
    const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) {
      return { imageDataUrl: placeholderFeaturedImageDataUrl() };
    }

    const modelId = process.env.IMAGEN_MODEL || AI_CONFIG.IMAGEN_MODEL;
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${modelId}:predict`;

    const { data } = await axios.post(
      url,
      {
        instances: [{ prompt: imagePrompt }],
        parameters: { sampleCount: 1, aspectRatio: "16:9" },
      },
      {
        headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
        timeout: 60_000,
        validateStatus: () => true,
      },
    );

    const predictions = data?.predictions;
    if (predictions?.length && predictions[0].bytesBase64Encoded) {
      const mime = predictions[0].mimeType || "image/png";
      const base64 = predictions[0].bytesBase64Encoded;
      return { imageDataUrl: `data:${mime};base64,${base64}` };
    }
  } catch {
    // Imagen not enabled or quota – return placeholder so UI flow still works
  }

  return { imageDataUrl: placeholderFeaturedImageDataUrl() };
}
