/**
 * Publishing platform identifiers (must match server PLATFORMS slugs).
 */
export const PLATFORMS = Object.freeze({
  MEDIUM: "medium",
  DEVTO: "devto",
  WORDPRESS: "wordpress",
} as const);

export type PlatformSlug = (typeof PLATFORMS)[keyof typeof PLATFORMS];

/** Platforms the Generate Post flow can optimize content for (subset of publishing targets). */
export const OPTIMIZATION_TARGETS = Object.freeze({
  DEVTO: "devto",
  LINKEDIN: "linkedin",
} as const);

export type OptimizationTarget = (typeof OPTIMIZATION_TARGETS)[keyof typeof OPTIMIZATION_TARGETS];
