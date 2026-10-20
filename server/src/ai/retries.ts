/**
 * Retry transient Google GenAI failures (429 / 5xx).
 */
import { AI_CONFIG } from "@constants";

// Note: 429 / RESOURCE_EXHAUSTED is not retried here — generatePost falls back to another model instead.

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const attempts = options.attempts ?? AI_CONFIG.RETRY_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? AI_CONFIG.RETRY_BASE_DELAY_MS;
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const retryable = AI_CONFIG.ERR_RETRYABLE_PATTERN.test(msg);
      if (!retryable || i === attempts - 1) {
        throw err;
      }
      const jitter = Math.floor(Math.random() * AI_CONFIG.RETRY_JITTER_MAX_MS);
      const delay = baseDelayMs * 2 ** i + jitter;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}
