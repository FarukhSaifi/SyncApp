import { APP_CONFIG } from "./config";

/** Aligned with server DEFAULT_VALUES.DEFAULT_PAGE_SIZE */
export const DEFAULT_PAGE_SIZE = APP_CONFIG.DEFAULT_LIMIT;
export const MAX_PAGE_SIZE = APP_CONFIG.MAX_LIMIT;

export const DEFAULT_PAGINATION = Object.freeze({
  page: APP_CONFIG.DEFAULT_PAGE,
  limit: DEFAULT_PAGE_SIZE,
} as const);
