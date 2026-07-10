/**
 * Publishing platform identifiers (must match server PLATFORMS slugs).
 */
export const PLATFORMS = Object.freeze({
  MEDIUM: "medium",
  DEVTO: "devto",
  WORDPRESS: "wordpress",
} as const);

export type PlatformSlug = (typeof PLATFORMS)[keyof typeof PLATFORMS];

/** AI optimization targets (Phase 1 — LinkedIn is optimize-only until publish integration). */
export const OPTIMIZATION_TARGETS = Object.freeze({
  DEVTO: "devto",
  LINKEDIN: "linkedin",
} as const);

export type OptimizationTarget = (typeof OPTIMIZATION_TARGETS)[keyof typeof OPTIMIZATION_TARGETS];

export const VALID_OPTIMIZATION_TARGETS = Object.freeze(Object.values(OPTIMIZATION_TARGETS)) as OptimizationTarget[];

export const DEFAULT_OPTIMIZATION_TARGETS: OptimizationTarget[] = [OPTIMIZATION_TARGETS.DEVTO];
