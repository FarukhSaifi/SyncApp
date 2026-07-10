/**
 * Theme and local storage keys.
 */
export const THEME_VALUES = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
} as const);

export const STORAGE_KEYS = Object.freeze({
  AUTH_TOKEN: "token",
  THEME: "theme",
  AI_CONTENT_MODEL: "ai_content_model",
  AI_OPTIMIZATION_TARGETS: "ai_optimization_targets",
} as const);
