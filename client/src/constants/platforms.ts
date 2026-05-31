/**
 * Publishing platform identifiers (must match server PLATFORMS slugs).
 */
export const PLATFORMS = Object.freeze({
  MEDIUM: "medium",
  DEVTO: "devto",
  WORDPRESS: "wordpress",
} as const);

export type PlatformSlug = (typeof PLATFORMS)[keyof typeof PLATFORMS];
