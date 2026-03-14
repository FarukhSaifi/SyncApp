/**
 * Environment-aware logger for the client app.
 * - Development: full logs (debug, errors with details).
 * - Production: no sensitive details (errors log message only, no stack/data).
 */
const isDev = (): boolean =>
  process.env.NODE_ENV === "development";

/** Dev-only; no-op in production. Use for debug logs. */
export const devLog = (...args: unknown[]): void => {
  if (isDev()) {
    console.log(...args);
  }
};

/** Dev-only; no-op in production. Use for warnings. */
export const devWarn = (...args: unknown[]): void => {
  if (isDev()) {
    console.warn(...args);
  }
};

/** Dev-only; no-op in production. Use for verbose error details. */
export const devError = (...args: unknown[]): void => {
  if (isDev()) {
    console.error(...args);
  }
};

/**
 * Safe error logging: in development logs full error; in production logs only the message (no stack, no response data).
 * Use for app errors (auth, API, etc.) so production never logs sensitive details.
 */
export const logError = (message: string, error: unknown = null): void => {
  if (isDev()) {
    if (error != null) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  } else {
    console.error(message);
  }
};
