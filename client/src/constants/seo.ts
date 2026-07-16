/**
 * SEO scorecard constants – thresholds and check labels.
 * Aligned with DEV.to feed ranking + Google Search best practices.
 * Used by utils/seoScorecard.ts for consistent, maintainable SEO scoring.
 *
 * Intentionally word-count-neutral: the scorecard does not reward or penalize post length.
 */
export const SEO_THRESHOLDS = Object.freeze({
  TITLE_MIN: 30,
  TITLE_MAX: 60,
  META_DESC_MIN: 120,
  META_DESC_MAX: 150,
  META_DESC_CAP: 200,
  TAG_COUNT_IDEAL: 4,
  TAG_COUNT_MAX: 4,
  SCORE_MAX: 100,
  SCORE_WITHOUT_CONTENT_DIVISOR: 80,
} as const);

/** High-reach DEV.to tags for SEO scorecard — at least one improves feed placement */
export const DEVTO_HIGH_REACH_TAGS = Object.freeze([
  "webdev",
  "programming",
  "javascript",
  "tutorial",
  "beginners",
  "devops",
  "ai",
  "react",
  "productivity",
] as const);

export const SEO_WEIGHTS = Object.freeze({
  TITLE: 18,
  TITLE_PARTIAL: 7,
  TAGS: 14,
  TAGS_PARTIAL: 7,
  COVER: 10,
  COVER_PUBLIC: 4,
  CANONICAL: 9,
  META_FULL: 10,
  META_PARTIAL: 5,
  INTERNAL_LINKS: 3,
  REPO_LINK: 12,
  TROUBLESHOOTING: 10,
  DISCUSSION: 8,
  DIRECT_ANSWER: 2,
} as const);

export const SEO_CHECK_LABELS = Object.freeze({
  TITLE_MISSING: "Title missing",
  TITLE_OK: "Keyword-frontloaded title (30-60 chars)",
  TITLE_TOO_SHORT: (len: number) => `Title too short (${len} chars, aim 30-60)`,
  TITLE_TOO_LONG: (len: number) => `Title long (${len} chars, aim 30-60)`,
  TAGS_IDEAL: "Exactly 4 tags (2 reach + 2 stack-specific)",
  TAGS_PARTIAL: (count: number) => `${count} tag(s) — DEV.to allows up to 4, aim for exactly 4`,
  TAGS_NO_REACH: "No high-reach tag (add webdev, programming, or tutorial)",
  TAGS_HAS_REACH: "Includes high-reach DEV.to feed tag",
  NO_TAGS: "No tags",
  HAS_COVER: "Cover / featured image set",
  COVER_PUBLIC: "Cover is a public URL (required for DEV.to)",
  COVER_NOT_PUBLIC: "Cover must be a public URL — upload before publishing",
  NO_COVER: "No cover image (DEV feed click-through drops sharply)",
  CANONICAL_SET: "Canonical URL set",
  NO_CANONICAL: "No canonical URL",
  META_LENGTH_OK: "Meta description length (120-150 chars, snippet-ready)",
  META_LENGTH_TOO_SHORT: (len: number) => `Meta description too short (${len} chars, aim 120-150)`,
  META_LENGTH_TOO_LONG: (len: number) => `Meta description too long (${len} chars, max 150 for snippets)`,
  NO_CONTENT_META: "No meta description",
  META_OPEN_POST: "Meta description (open post to check)",
  HAS_INTERNAL_LINKS: "Has internal links",
  NO_INTERNAL_LINKS: "No internal links",
  LINKS_OPEN_POST: "Internal links (open post to check)",
  HAS_REPO_LINK: "GitHub/repo link (E-E-A-T signal)",
  NO_REPO_LINK: "No repo or demo link in content",
  HAS_TROUBLESHOOTING: "Troubleshooting / Common Errors section",
  NO_TROUBLESHOOTING: "Missing Troubleshooting section",
  HAS_DISCUSSION: "Discussion question (DEV comment boost)",
  NO_DISCUSSION: "No discussion question — DEV ranks comments highly",
  HAS_DIRECT_ANSWER: "Direct Answer Block (Google snippet-ready)",
  NO_DIRECT_ANSWER: "Missing Direct Answer Block after intro",
} as const);

/** Pre-publish warnings shown when publishing to DEV.to */
export const DEVTO_PUBLISH_WARNINGS = Object.freeze({
  NO_META: "Meta description missing — Google and DEV previews will be weak",
  NO_COVER: "No public cover image — upload via AI modal before publishing",
  COVER_NOT_PUBLIC: "Cover is not a public URL — use Upload & Save before publishing",
  FEW_TAGS: "Use exactly 4 tags (2 high-reach + 2 stack-specific) for DEV feeds",
  NO_DISCUSSION: "Add a discussion question at the end to boost DEV engagement",
  LOW_SEO: (score: number) => `SEO score is ${score}/100 — fix warnings in the sidebar before publishing`,
} as const);

/** Origins treated as internal for link counting (markdown/HTML) */
export const INTERNAL_LINK_ORIGINS = Object.freeze(["yourblog.com", "localhost"] as const);

/** Hosts that signal technical authority when linked from post content */
export const AUTHORITY_LINK_HOSTS = Object.freeze(["github.com", "gitlab.com", "bitbucket.org"] as const);

export const MDX_DOWNLOAD = Object.freeze({
  FAILED_MESSAGE: "Failed to download MDX",
  FILENAME_PREFIX: "post-",
  FILENAME_EXT: ".mdx",
} as const);
