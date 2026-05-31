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
} as const);
