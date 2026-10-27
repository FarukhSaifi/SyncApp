/**
 * Central exports for all server constants
 */
import { DEFAULT_VALUES } from "./defaultValues";

export {
  AI_CONFIG,
  AI_IMAGE_SOURCES,
  AI_POST_LIMITS,
  AI_PROMPTS,
  AI_PROVIDERS,
  AI_RESPONSE_SCHEMA,
  AI_SEO_IMPROVE_RESPONSE_SCHEMA,
  AI_SAFETY_SETTINGS,
  AI_SEED_TOPIC_CATEGORIES,
  AI_SUGGESTION_SOURCES,
  isAllowedContentModel,
  resolveContentModel,
} from "./ai";
export {
  ANALYTICS_PLATFORMS,
  ANALYTICS_SYNC,
  GA4_EMPTY_TOTALS,
  GA4_REPORT,
  GA4_SOURCE_CHANNEL_MAP,
  GA4_TRAFFIC_CHANNELS,
} from "./analytics";
export type { AnalyticsPlatform, Ga4TrafficChannelId } from "./analytics";
export { API_URLS } from "./api";
export { DATABASE } from "./database";
export { DEFAULT_PASSWORDS, resolveTempPassword } from "./defaultPasswords";
export {
  BROWSER_ICON_PATHS,
  buildFirebaseStoragePublicUrl,
  buildGcsJsonApiMediaUploadUrl,
  buildGcsPublicObjectUrl,
  DEFAULT_VALUES,
  extensionForMime,
} from "./defaultValues";
export type { UploadImageMime } from "./defaultValues";
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
  includesGoogleTarget,
  includesLinkedInTarget,
  isValidOptimizationTargets,
  resolveOptimizationTargets,
} from "./platformOptimization";
export type { OptimizationTarget } from "./platformOptimization";
export { PLATFORM_TAG_LIMITS } from "./platformTags";
export type { PlatformTagLimitKey } from "./platformTags";
export {
  AUTHORITY_LINK_HOSTS,
  DEVTO_HIGH_REACH_TAGS,
  INTERNAL_LINK_FALLBACK_ORIGINS,
  SEO_ALT_DENYLIST,
  SEO_CATEGORIES,
  SEO_CHECK_LABELS,
  SEO_IMPROVE_APPLY,
  SEO_IMPROVE_FIELDS,
  SEO_IMPROVE_LIMITS,
  SEO_PUBLISH_WARNINGS,
  SEO_THRESHOLDS,
  SEO_WEIGHTS,
} from "./seo";
export type { SeoCategoryId } from "./seo";
export { ROUTES } from "./routes";
export { USER_ROLE_LABELS, USER_ROLES, VALID_USER_ROLES } from "./userRoles";
export type { UserRole } from "./userRoles";
export { UTM_CAMPAIGNS, UTM_MEDIUMS, UTM_PARAM_KEYS, UTM_SOURCES } from "./utm";
export type { UtmBuildOptions, UtmMedium, UtmSource } from "./utm";
export { NUMERIC_LIMITS, REGEX_PATTERNS, STRING_LIMITS, VALIDATION_ERRORS } from "./validation";

// Platform identifiers
export const PLATFORMS = Object.freeze({
  MEDIUM: "medium",
  DEVTO: "devto",
  WORDPRESS: "wordpress",
  LINKEDIN: "linkedin",
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

/** Platforms eligible for schedule / syndicate (excludes unused Hashnode slug). */
export const SCHEDULE_PLATFORMS = Object.freeze([
  PLATFORMS.MEDIUM,
  PLATFORMS.DEVTO,
  PLATFORMS.WORDPRESS,
  PLATFORMS.LINKEDIN,
] as const);

export type SchedulePlatform = (typeof SCHEDULE_PLATFORMS)[number];

export const VALID_SCHEDULE_PLATFORMS = Object.freeze([...SCHEDULE_PLATFORMS]) as SchedulePlatform[];

// Valid post status array
export const VALID_POST_STATUS = Object.freeze(Object.values(POST_STATUS)) as PostStatus[];

/** Extra list filters beyond Post.status (Dashboard DataTable). */
export const POST_LIST_FILTER = Object.freeze({
  ALL: "all",
  SCHEDULED: "scheduled",
} as const);

// Backward-compatibility direct exports
export const DEFAULT_PAGE_SIZE = DEFAULT_VALUES.DEFAULT_PAGE_SIZE;
export const MAX_PAGE_SIZE = DEFAULT_VALUES.MAX_PAGE_SIZE;
