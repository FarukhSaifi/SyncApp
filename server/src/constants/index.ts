/**
 * Central exports for all server constants
 */
import { DEFAULT_VALUES } from "./defaultValues";

export { ERROR_MESSAGES, SUCCESS_MESSAGES } from "./messages";
export { USER_ROLES, USER_ROLE_LABELS, VALID_USER_ROLES } from "./userRoles";
export type { UserRole } from "./userRoles";
export { HTTP_STATUS } from "./httpStatus";
export { DEFAULT_VALUES } from "./defaultValues";
export { STRING_LIMITS, NUMERIC_LIMITS, REGEX_PATTERNS, VALIDATION_ERRORS } from "./validation";
export { DATABASE } from "./database";
export { API_URLS } from "./api";
export { FIELDS } from "./fields";
export { PLATFORM_CONFIG } from "./platformConfig";
export { DEFAULT_PASSWORDS } from "./defaultPasswords";
export { HTTP } from "./http";
export { MDX_CONFIG } from "./mdx";
export { AI_PROMPTS, AI_CONFIG } from "./ai";
export { ROUTES } from "./routes";
export { HEALTH } from "./health";
export { SENSITIVE_KEYS, REDACT_PLACEHOLDER, DB_LOG } from "./logging";

// Platform identifiers
export const PLATFORMS = Object.freeze({
  MEDIUM: "medium",
  DEVTO: "devto",
  WORDPRESS: "wordpress",
  HASHNODE: "hashnode",
} as const);

export type Platform = (typeof PLATFORMS)[keyof typeof PLATFORMS];

// Post status values
export const POST_STATUS = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const);

export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

// Valid platform array
export const VALID_PLATFORMS = Object.freeze(Object.values(PLATFORMS)) as Platform[];

// Valid post status array
export const VALID_POST_STATUS = Object.freeze(Object.values(POST_STATUS)) as PostStatus[];

// Backward-compatibility direct exports
export const DEFAULT_PAGE_SIZE = DEFAULT_VALUES.DEFAULT_PAGE_SIZE;
export const MAX_PAGE_SIZE = DEFAULT_VALUES.MAX_PAGE_SIZE;
