/**
 * Normalize Google GenAI / Studio errors into AppError for the API client.
 */
import { HTTP_STATUS } from "../constants/httpStatus";
import { ERROR_MESSAGES } from "../constants/messages";
import { AppError } from "../middleware/errorHandler";

export function normalizeAiError(err: Error & { status?: number; details?: unknown }, fallbackMessage: string): never {
  if (err instanceof AppError) throw err;
  const msg = err.message || "";

  const is401 =
    msg.includes("401") ||
    msg.includes("API_KEY_INVALID") ||
    msg.includes("API key not valid") ||
    msg.includes("API_KEY_INVALID") ||
    /invalid.*api.?key/i.test(msg);
  if (is401) {
    throw new AppError(ERROR_MESSAGES.GEMINI_API_KEY_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const is404 = msg.includes("404") || msg.includes("NOT_FOUND");
  if (is404 && (msg.includes("models/") || msg.includes("Publisher Model") || msg.includes("imagen"))) {
    throw new AppError(ERROR_MESSAGES.AI_MODEL_NOT_FOUND, HTTP_STATUS.BAD_REQUEST);
  }

  const is429 = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Resource exhausted");
  if (is429) {
    throw new AppError(ERROR_MESSAGES.AI_RATE_LIMITED, HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  const is503 = msg.includes("503") || msg.includes("UNAVAILABLE") || /high demand|currently experiencing/i.test(msg);
  if (is503) {
    throw new AppError(ERROR_MESSAGES.AI_UNAVAILABLE, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  throw new AppError(err.message || fallbackMessage, err.status ?? HTTP_STATUS.BAD_GATEWAY, err.details);
}

/** True when we should try the next model (quota or temporary overload). */
export function isFallbackWorthyError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /404|NOT_FOUND|not found|429|RESOURCE_EXHAUSTED|Resource exhausted|503|UNAVAILABLE|high demand|currently experiencing/i.test(msg);
}

/** @deprecated Use isFallbackWorthyError */
export function isModelUnavailableError(err: unknown): boolean {
  return isFallbackWorthyError(err);
}
