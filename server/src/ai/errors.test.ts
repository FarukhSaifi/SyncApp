import { AI_CONFIG } from "@constants";
import { AppError } from "@middleware/errorHandler";
import { describe, expect, it } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

import { isCreditsDepletedError, isFallbackWorthyError, normalizeAiError } from "./errors";

describe("normalizeAiError", () => {
  it("re-throws AppError unchanged", () => {
    const original = new AppError("keep", HTTP_STATUS.BAD_REQUEST);
    expect(() => normalizeAiError(original, "fallback")).toThrow(original);
  });

  it("maps invalid API key messages to 401", () => {
    expect(() => normalizeAiError(new Error(AI_CONFIG.ERR_API_KEY_INVALID), "x")).toThrow(AppError);
    try {
      normalizeAiError(new Error(AI_CONFIG.ERR_API_KEY_INVALID), "x");
    } catch (e) {
      expect((e as AppError).message).toBe(ERROR_MESSAGES.GEMINI_API_KEY_INVALID);
      expect((e as AppError).statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    }
  });

  it("maps rate limit messages to 429", () => {
    try {
      normalizeAiError(new Error(AI_CONFIG.ERR_RESOURCE_EXHAUSTED), "x");
    } catch (e) {
      expect((e as AppError).statusCode).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    }
  });

  it("maps model-not-found 404 to 400", () => {
    const err = new Error(`${AI_CONFIG.ERR_HTTP_404} ${AI_CONFIG.ERR_MODELS_PATH}/missing`);
    try {
      normalizeAiError(err, "x");
    } catch (e) {
      expect((e as AppError).message).toBe(ERROR_MESSAGES.AI_MODEL_NOT_FOUND);
    }
  });

  it("falls back to generic AppError with message", () => {
    try {
      normalizeAiError(new Error("custom upstream"), "fallback-msg");
    } catch (e) {
      expect((e as AppError).message).toBe("custom upstream");
    }
  });
});

describe("isCreditsDepletedError", () => {
  it("detects prepayment credit errors", () => {
    expect(isCreditsDepletedError(new Error(AI_CONFIG.ERR_PREPAYMENT_CREDITS))).toBe(true);
    expect(isCreditsDepletedError(new Error("other"))).toBe(false);
  });
});

describe("isFallbackWorthyError", () => {
  it("returns false for credits depleted", () => {
    expect(isFallbackWorthyError(new Error(AI_CONFIG.ERR_PREPAYMENT_CREDITS))).toBe(false);
  });

  it("returns true for retryable model errors", () => {
    expect(isFallbackWorthyError(new Error(`${AI_CONFIG.ERR_HTTP_503} unavailable`))).toBe(true);
  });
});
