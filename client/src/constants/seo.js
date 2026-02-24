/**
 * SEO scorecard constants – thresholds and check labels.
 * Used by utils/seoScorecard.js for consistent, maintainable SEO scoring.
 */
export const SEO_THRESHOLDS = Object.freeze({
  TITLE_MIN: 30,
  TITLE_MAX: 60,
  META_DESC_MIN: 120,
  META_DESC_MAX: 160,
  META_DESC_CAP: 200,
  SCORE_MAX: 100,
  SCORE_WITHOUT_CONTENT_DIVISOR: 80,
});

export const SEO_WEIGHTS = Object.freeze({
  TITLE: 25,
  TITLE_PARTIAL: 10,
  TAGS: 20,
  COVER: 20,
  CANONICAL: 15,
  META_FULL: 10,
  META_PARTIAL: 5,
  INTERNAL_LINKS: 10,
});

export const SEO_CHECK_LABELS = Object.freeze({
  TITLE_MISSING: "Title missing",
  TITLE_OK: "Keyword in title / title length (30-60 chars)",
  TITLE_TOO_SHORT: (len) => `Title too short (${len} chars, aim 30-60)`,
  TITLE_TOO_LONG: (len) => `Title long (${len} chars, aim 30-60)`,
  HAS_TAGS: "Has tags",
  NO_TAGS: "No tags",
  HAS_COVER: "Cover / featured image",
  NO_COVER: "No cover image",
  CANONICAL_SET: "Canonical URL set",
  NO_CANONICAL: "No canonical URL",
  META_LENGTH_OK: "Meta description length (from content)",
  META_LENGTH_BAD: (len) => `Meta description length (${len} chars, aim 120-160)`,
  NO_CONTENT_META: "No content for meta description",
  META_OPEN_POST: "Meta description (open post to check)",
  HAS_INTERNAL_LINKS: "Has internal links",
  NO_INTERNAL_LINKS: "No internal links",
  LINKS_OPEN_POST: "Internal links (open post to check)",
});

/** Origins treated as internal for link counting (markdown/HTML) */
export const INTERNAL_LINK_ORIGINS = Object.freeze(["yourblog.com", "localhost"]);

export const MDX_DOWNLOAD = Object.freeze({
  FAILED_MESSAGE: "Failed to download MDX",
  FILENAME_PREFIX: "post-",
  FILENAME_EXT: ".mdx",
});
