/**
 * Normalize Google GenAI / Vertex / Studio errors into AppError for the API client.
 */
import { AI_CONFIG } from "@constants";
import { AppError } from "@middleware/errorHandler";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

export function normalizeAiError(err: Error & { status?: number; details?: unknown }, fallbackMessage: string): never {
  if (err instanceof AppError) {
    throw err;
  }
  const msg = err.message || "";

  const isVertexAuth =
    msg.includes(AI_CONFIG.ERR_UNAUTHENTICATED) ||
    msg.includes(AI_CONFIG.ERR_PERMISSION_DENIED) ||
    msg.includes(AI_CONFIG.ERR_DEFAULT_CREDENTIALS) ||
    msg.includes(AI_CONFIG.ERR_INVALID_GRANT) ||
    msg.includes(AI_CONFIG.ERR_INVALID_RAPT) ||
    (msg.includes(AI_CONFIG.ERR_HTTP_403) && AI_CONFIG.ERR_VERTEX_AUTH_HINT_PATTERN.test(msg));
  if (isVertexAuth) {
    throw new AppError(ERROR_MESSAGES.VERTEX_AI_AUTH_FAILED, HTTP_STATUS.UNAUTHORIZED);
  }

  const is401 =
    msg.includes(AI_CONFIG.ERR_HTTP_401) ||
    msg.includes(AI_CONFIG.ERR_API_KEY_INVALID) ||
    msg.includes(AI_CONFIG.ERR_API_KEY_NOT_VALID) ||
    AI_CONFIG.ERR_API_KEY_PATTERN.test(msg);
  if (is401) {
    throw new AppError(ERROR_MESSAGES.GEMINI_API_KEY_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const is404 = msg.includes(AI_CONFIG.ERR_HTTP_404) || msg.includes(AI_CONFIG.ERR_NOT_FOUND);
  if (
    is404 &&
    (msg.includes(AI_CONFIG.ERR_MODELS_PATH) ||
      msg.includes(AI_CONFIG.ERR_PUBLISHER_MODEL) ||
      msg.includes(AI_CONFIG.IMAGEN_MODEL_PREFIX) ||
      msg.includes(AI_CONFIG.ERR_PUBLISHERS_GOOGLE))
  ) {
    throw new AppError(ERROR_MESSAGES.AI_MODEL_NOT_FOUND, HTTP_STATUS.BAD_REQUEST);
  }

  if (isCreditsDepletedError(err)) {
    throw new AppError(ERROR_MESSAGES.AI_CREDITS_DEPLETED, HTTP_STATUS.PAYMENT_REQUIRED);
  }

  const is429 =
    msg.includes(AI_CONFIG.ERR_HTTP_429) ||
    msg.includes(AI_CONFIG.ERR_RESOURCE_EXHAUSTED) ||
    msg.includes(AI_CONFIG.ERR_RESOURCE_EXHAUSTED_MSG);
  if (is429) {
    throw new AppError(ERROR_MESSAGES.AI_RATE_LIMITED, HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  const is503 =
    msg.includes(AI_CONFIG.ERR_HTTP_503) ||
    msg.includes(AI_CONFIG.ERR_UNAVAILABLE) ||
    msg.toLowerCase().includes(AI_CONFIG.ERR_HIGH_DEMAND) ||
    msg.toLowerCase().includes(AI_CONFIG.ERR_CURRENTLY_EXPERIENCING);
  if (is503) {
    throw new AppError(ERROR_MESSAGES.AI_UNAVAILABLE, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  throw new AppError(err.message || fallbackMessage, err.status ?? HTTP_STATUS.BAD_GATEWAY, err.details);
}

/** True when Google reports prepaid AI Studio credits are gone (HTTP 402). */
export function isCreditsDepletedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes(AI_CONFIG.ERR_PREPAYMENT_CREDITS) ||
    msg.includes(AI_CONFIG.ERR_PREPAY) ||
    AI_CONFIG.ERR_CODE_402_PATTERN.test(msg) ||
    msg.includes(AI_CONFIG.ERR_CODE_402_JSON)
  );
}

/**
 * True when we should try the next model (missing model or temporary overload).
 * Credits depletion is account-wide — do not burn fallback models.
 */
export function isFallbackWorthyError(err: unknown): boolean {
  if (isCreditsDepletedError(err)) {
    return false;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return AI_CONFIG.ERR_FALLBACK_WORTHY_PATTERN.test(msg);
}
