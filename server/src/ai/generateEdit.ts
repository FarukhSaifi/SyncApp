/**
 * Inline editor AI actions (proofread, rewrite, etc.) — Google AI Studio.
 */
import { AI_CONFIG, AI_PROMPTS } from "../constants";
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";
import { buildModelCandidates, getModelName, getText, studioGenerateContent } from "./client";
import { isFallbackWorthyError, normalizeAiError } from "./errors";
import { withRetry } from "./retries";

export async function generateEdit(action: string, contextText: string): Promise<string> {
  if (!contextText || typeof contextText !== "string" || !contextText.trim()) {
    throw new AppError(ERROR_MESSAGES.AI_EDIT_CONTEXT_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  const candidates = buildModelCandidates(getModelName());
  let lastError: unknown;

  for (const modelName of candidates) {
    try {
      const result = await withRetry(() =>
        studioGenerateContent({
          model: modelName,
          contents: AI_PROMPTS.EDITOR_TOOL_USER(action, contextText.trim()),
          systemInstruction: AI_PROMPTS.EDITOR_TOOL_SYSTEM,
          maxOutputTokens: AI_CONFIG.MAX_EDIT_TOKENS,
          temperature: AI_CONFIG.TEMPERATURE_EDIT,
        }),
      );
      return getText(result);
    } catch (err) {
      lastError = err;
      if (!isFallbackWorthyError(err)) {
        return normalizeAiError(err as Error & { status?: number; details?: unknown }, ERROR_MESSAGES.AI_EDIT_FAILED);
      }
    }
  }

  return normalizeAiError(
    (lastError as Error & { status?: number; details?: unknown }) || new Error(ERROR_MESSAGES.AI_EDIT_FAILED),
    ERROR_MESSAGES.AI_EDIT_FAILED,
  );
}
