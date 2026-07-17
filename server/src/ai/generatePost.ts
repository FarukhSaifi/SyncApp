/**
 * Full-post generation — Google AI Studio only.
 */
import { config } from "../config";
import {
  AI_CONFIG,
  AI_RESPONSE_SCHEMA,
  buildFullPostSystemPrompt,
  buildFullPostUserPrompt,
  includesLinkedInTarget,
} from "../constants";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";
import type { GeneratePostResult } from "../types";
import { buildReadMoreUrl, slugifyArticlePath } from "../utils/linkedinPost";
import { buildModelCandidates, getModelName, getText, studioGenerateContent } from "./client";
import { isFallbackWorthyError, normalizeAiError } from "./errors";
import { withRetry } from "./retries";
import { parseGeneratePostResponse } from "./schemas";

function isRateLimited(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /429|RESOURCE_EXHAUSTED|Resource exhausted/i.test(msg);
}

async function generateWithModel(
  modelName: string,
  systemInstruction: string,
  userMessage: string,
  useSearch: boolean,
  includeLinkedIn: boolean,
): Promise<GeneratePostResult> {
  // Pro / paid-quota models: one shot then fall back (avoid burning retries on 429).
  const attempts = /pro/i.test(modelName) ? 1 : AI_CONFIG.RETRY_ATTEMPTS;
  const result = await withRetry(
    () =>
      studioGenerateContent({
        model: modelName,
        contents: userMessage,
        systemInstruction,
        maxOutputTokens: AI_CONFIG.MAX_DRAFT_TOKENS,
        temperature: AI_CONFIG.TEMPERATURE_POST,
        responseMimeType: "application/json",
        responseSchema: AI_RESPONSE_SCHEMA,
        ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
      }),
    { attempts },
  );
  return parseGeneratePostResponse(getText(result), { includeLinkedIn });
}

export async function generatePost(
  keyword: string,
  options: { model?: string; targetPlatforms?: string[] } = {},
): Promise<GeneratePostResult> {
  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_KEYWORD_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  const includeLinkedIn = includesLinkedInTarget(options.targetPlatforms);
  // Hint URL from keyword slug when base is configured (final URL uses AI title/slug after parse).
  const readMoreHint = includeLinkedIn
    ? buildReadMoreUrl(keyword.trim(), slugifyArticlePath(keyword.trim()))
    : undefined;

  const primaryModel = getModelName(options.model);
  const systemInstruction = buildFullPostSystemPrompt(options.targetPlatforms);
  const userMessage = buildFullPostUserPrompt(keyword.trim(), options.targetPlatforms, {
    readMoreUrl: readMoreHint,
  });
  const candidates = buildModelCandidates(primaryModel);

  if (config.aiUseGoogleSearchRetrieval) {
    try {
      return await generateWithModel(primaryModel, systemInstruction, userMessage, true, includeLinkedIn);
    } catch {
      // Grounding unavailable — fall through to standard generation.
    }
  }

  let lastError: unknown;
  for (const modelName of candidates) {
    try {
      return await generateWithModel(modelName, systemInstruction, userMessage, false, includeLinkedIn);
    } catch (err) {
      lastError = err;
      if (!isFallbackWorthyError(err)) {
        return normalizeAiError(err as Error & { status?: number; details?: unknown }, ERROR_MESSAGES.AI_DRAFT_FAILED);
      }
    }
  }

  if (isRateLimited(lastError)) {
    throw new AppError(ERROR_MESSAGES.AI_RATE_LIMITED, HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  return normalizeAiError(
    (lastError as Error & { status?: number; details?: unknown }) || new Error(ERROR_MESSAGES.AI_UNAVAILABLE),
    ERROR_MESSAGES.AI_DRAFT_FAILED,
  );
}
