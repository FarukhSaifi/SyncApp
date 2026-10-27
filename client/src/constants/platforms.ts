/**
 * Publishing platform identifiers (must match server PLATFORMS slugs).
 */
export const PLATFORMS = Object.freeze({
  MEDIUM: "medium",
  DEVTO: "devto",
  WORDPRESS: "wordpress",
  LINKEDIN: "linkedin",
} as const);

export type PlatformSlug = (typeof PLATFORMS)[keyof typeof PLATFORMS];

/** Human-readable display names for platforms. */
export const PLATFORM_DISPLAY_NAMES: Record<PlatformSlug, string> = Object.freeze({
  [PLATFORMS.MEDIUM]: "Medium",
  [PLATFORMS.DEVTO]: "DEV.to",
  [PLATFORMS.WORDPRESS]: "WordPress",
  [PLATFORMS.LINKEDIN]: "LinkedIn",
});

/** AI optimization targets (DEV.to article, LinkedIn summary, Google Search SEO). */
export const OPTIMIZATION_TARGETS = Object.freeze({
  DEVTO: "devto",
  LINKEDIN: "linkedin",
  GOOGLE: "google",
} as const);

export type OptimizationTarget = (typeof OPTIMIZATION_TARGETS)[keyof typeof OPTIMIZATION_TARGETS];

export const VALID_OPTIMIZATION_TARGETS = Object.freeze(Object.values(OPTIMIZATION_TARGETS)) as OptimizationTarget[];

export const DEFAULT_OPTIMIZATION_TARGETS: OptimizationTarget[] = [OPTIMIZATION_TARGETS.DEVTO];

/** Schedule modal checkbox order (Medium → DEV.to → WordPress → LinkedIn). */
export const SCHEDULE_PLATFORM_ORDER = Object.freeze([
  PLATFORMS.MEDIUM,
  PLATFORMS.DEVTO,
  PLATFORMS.WORDPRESS,
  PLATFORMS.LINKEDIN,
] as const satisfies readonly PlatformSlug[]);
