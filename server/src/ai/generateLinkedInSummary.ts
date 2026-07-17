/**
 * Generate a short LinkedIn-native teaser from an existing article (title + body).
 */
import { AI_CONFIG, AI_POST_LIMITS, AI_PROMPTS, isAllowedContentModel } from "../constants";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";
import { buildReadMoreUrl, finalizeLinkedInPost } from "../utils/linkedinPost";
import { buildModelCandidates, getModelName, getText, studioGenerateContent } from "./client";
import { isFallbackWorthyError, normalizeAiError } from "./errors";
import { withRetry } from "./retries";

const MAX_ARTICLE_CHARS = 8000;

function stripToPlainText(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type GenerateLinkedInSummaryInput = {
  title?: string;
  content?: string;
  model?: string;
  /** Preferred public article URL for Read more. */
  readMoreUrl?: string;
};

export type GenerateLinkedInSummaryResult = {
  linkedin_post: string;
  read_more_url?: string;
  linkedin_missing_canonical?: boolean;
};

export async function generateLinkedInSummary(
  input: GenerateLinkedInSummaryInput,
): Promise<GenerateLinkedInSummaryResult> {
  const title = (input.title || "").trim();
  const content = (input.content || "").trim();
  const plain = stripToPlainText(content);
  const excerptSource = [title, plain].filter(Boolean).join(". ");

  if (!excerptSource || excerptSource.length < 20) {
    throw new AppError(ERROR_MESSAGES.AI_LINKEDIN_SUMMARY_CONTEXT_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  if (input.model && !isAllowedContentModel(input.model)) {
    throw new AppError(ERROR_MESSAGES.AI_INVALID_MODEL, HTTP_STATUS.BAD_REQUEST);
  }

  const excerpt = excerptSource.slice(0, MAX_ARTICLE_CHARS);
  const displayTitle = title || excerpt.slice(0, 80);
  const candidates = buildModelCandidates(getModelName(input.model));
  let lastError: unknown;
  let rawPost = "";

  for (const modelName of candidates) {
    try {
      const result = await withRetry(() =>
        studioGenerateContent({
          model: modelName,
          contents: AI_PROMPTS.LINKEDIN_SUMMARY_USER(displayTitle, excerpt),
          systemInstruction: AI_PROMPTS.LINKEDIN_SUMMARY_SYSTEM,
          maxOutputTokens: AI_CONFIG.MAX_LINKEDIN_SUMMARY_TOKENS,
          temperature: AI_CONFIG.TEMPERATURE_POST,
        }),
      );
      rawPost = getText(result).trim();
      if (rawPost) break;
    } catch (err) {
      lastError = err;
      if (!isFallbackWorthyError(err)) {
        return normalizeAiError(
          err as Error & { status?: number; details?: unknown },
          ERROR_MESSAGES.AI_LINKEDIN_SUMMARY_FAILED,
        );
      }
    }
  }

  if (!rawPost) {
    return normalizeAiError(
      (lastError as Error & { status?: number; details?: unknown }) ||
        new Error(ERROR_MESSAGES.AI_LINKEDIN_SUMMARY_FAILED),
      ERROR_MESSAGES.AI_LINKEDIN_SUMMARY_FAILED,
    );
  }

  // Strip accidental fences / quotes from the model.
  rawPost = rawPost
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();

  const preferred = (input.readMoreUrl || "").trim();
  const readMoreUrl = preferred && /^https?:\/\//i.test(preferred) ? preferred : buildReadMoreUrl(displayTitle);
  const linkedin_post = finalizeLinkedInPost(rawPost, readMoreUrl);

  // Soft length nudge — model guidance is primary; do not hard-fail short teasers.
  if (linkedin_post.length < AI_POST_LIMITS.LINKEDIN_POST_MIN_CHARS / 2) {
    throw new AppError(ERROR_MESSAGES.AI_LINKEDIN_SUMMARY_FAILED, HTTP_STATUS.BAD_GATEWAY);
  }

  return {
    linkedin_post,
    read_more_url: readMoreUrl,
    linkedin_missing_canonical: !readMoreUrl,
  };
}
