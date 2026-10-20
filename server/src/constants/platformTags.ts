/**
 * Per-platform tag / hashtag limits for AI generation and publishing.
 *
 * DEV.to article API: hard max 4 tags.
 * LinkedIn: research (Sprout Social 2026, Metricool 2026, UTA engagement study)
 * favors 3–5 highly relevant hashtags; we use 5 (upper end of the sweet spot,
 * and more than DEV.to’s 4) for best reach without spammy volume.
 */
export const PLATFORM_TAG_LIMITS = Object.freeze({
  DEVTO: Object.freeze({
    MIN: 4,
    IDEAL: 4,
    MAX: 4,
  }),
  LINKEDIN: Object.freeze({
    MIN: 3,
    IDEAL: 5,
    MAX: 5,
  }),
  /** SEO topical tags when optimizing for Google Search (no publish API cap). */
  GOOGLE: Object.freeze({
    MIN: 3,
    IDEAL: 5,
    MAX: 8,
  }),
} as const);

export type PlatformTagLimitKey = keyof typeof PLATFORM_TAG_LIMITS;
