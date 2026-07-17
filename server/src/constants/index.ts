/**
 * Central exports for all server constants
 */
import { DEFAULT_VALUES } from "./defaultValues";

export {
  AI_CONFIG,
  AI_POST_LIMITS,
  AI_PROMPTS,
  AI_RESPONSE_SCHEMA,
  AI_SAFETY_SETTINGS,
  isAllowedContentModel,
  resolveContentModel,
} from "./ai";
export { API_URLS } from "./api";
export { DATABASE } from "./database";
export { DEFAULT_PASSWORDS } from "./defaultPasswords";
export { DEFAULT_VALUES } from "./defaultValues";
export { FIELDS } from "./fields";
export { HEALTH } from "./health";
export { HTTP } from "./http";
export { HTTP_STATUS } from "./httpStatus";
export { DB_LOG, REDACT_PLACEHOLDER, SENSITIVE_KEYS } from "./logging";
export { MDX_CONFIG } from "./mdx";
export { ERROR_MESSAGES, SUCCESS_MESSAGES } from "./messages";
export { PLATFORM_CONFIG } from "./platformConfig";
export {
  AI_OPTIMIZATION_TARGETS,
  buildFullPostSystemPrompt,
  buildFullPostUserPrompt,
  includesLinkedInTarget,
  isValidOptimizationTargets,
  resolveOptimizationTargets,
} from "./platformOptimization";
export type { OptimizationTarget } from "./platformOptimization";
export { ROUTES } from "./routes";
export { USER_ROLE_LABELS, USER_ROLES, VALID_USER_ROLES } from "./userRoles";
export type { UserRole } from "./userRoles";
export { NUMERIC_LIMITS, REGEX_PATTERNS, STRING_LIMITS, VALIDATION_ERRORS } from "./validation";

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
