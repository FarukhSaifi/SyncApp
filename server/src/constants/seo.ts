/**
 * SEO scorecard constants – keep in sync with client/src/constants/seo.ts.
 * Used by services/seoScoreService.ts for generate/publish soft gates.
 *
 * Intentionally word-count-neutral and density-%-free.
 */
export const SEO_CATEGORIES = Object.freeze({
  METADATA: "metadata",
  STRUCTURE: "structure",
  TRUST: "trust",
} as const);

export type SeoCategoryId = (typeof SEO_CATEGORIES)[keyof typeof SEO_CATEGORIES];

export const SEO_THRESHOLDS = Object.freeze({
  TITLE_MIN: 30,
  TITLE_MAX: 60,
  META_DESC_MIN: 120,
  META_DESC_MAX: 160,
  META_DESC_SNIPPET_SOFT: 155,
  META_DESC_CAP: 200,
  TAG_COUNT_IDEAL: 4,
  TAG_COUNT_MAX: 4,
  TAG_COUNT_GOOGLE_MIN: 3,
  TAG_COUNT_GOOGLE_IDEAL: 5,
  TAG_COUNT_GOOGLE_MAX: 8,
  SCORE_MAX: 100,
  SCORE_WITHOUT_CONTENT_DIVISOR: 80,
  DISCUSSION_TAIL_CHARS: 600,
  DIRECT_ANSWER_INTRO_CHARS: 1200,
  DIRECT_ANSWER_BEFORE_H2_FALLBACK_CHARS: 600,
  DIRECT_ANSWER_MIN_SENTENCE_CHARS: 20,
  DIRECT_ANSWER_MIN_SENTENCES: 2,
  DIRECT_ANSWER_MIN_WORDS: 35,
  DIRECT_ANSWER_MAX_WORDS: 50,
  QUERY_INTRO_CHARS: 1200,
  MIN_H2_COUNT: 2,
  STUFFING_NGRAM_SIZE: 3,
  STUFFING_MAX_REPEATS: 4,
  STUFFING_SCAN_CHARS: 1200,
  PUBLISH_WARNING_SCORE_MIN: 60,
  META_TITLE_SIMILARITY_RATIO: 0.85,
} as const);

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
  TITLE: 10,
  TITLE_PARTIAL: 4,
  TITLE_QUERY: 6,
  META_FULL: 10,
  META_PARTIAL: 5,
  CANONICAL: 5,
  META_UNIQUE: 4,
  DIRECT_ANSWER: 8,
  DIRECT_ANSWER_NO_DEV_BOOST: 2,
  HEADINGS: 6,
  HEADINGS_NO_DEV_BOOST: 1,
  QUERY_INTRO: 5,
  ANTI_STUFFING: 5,
  IMAGE_ALT: 6,
  INTERNAL_LINKS: 4,
  AUTHORITY: 6,
  COVER: 5,
  COVER_PUBLIC: 3,
  SCHEMA_READY: 5,
  TAGS: 4,
  TAGS_PARTIAL: 2,
  TAGS_REACH: 2,
  TAGS_GOOGLE: 6,
  TAGS_GOOGLE_PARTIAL: 3,
  TROUBLESHOOTING: 3,
  DISCUSSION: 3,
} as const);

export const SEO_CHECK_LABELS = Object.freeze({
  TITLE_MISSING: "Title missing",
  TITLE_OK: "Title length (30-60 chars)",
  TITLE_TOO_SHORT: (len: number) => `Title too short (${len} chars, aim 30-60)`,
  TITLE_TOO_LONG: (len: number) => `Title long (${len} chars, aim 30-60)`,
  TITLE_QUERY_OK: "Primary keyword appears in title",
  TITLE_QUERY_MISSING: "Primary keyword missing from title",
  TITLE_QUERY_NA: "Primary keyword in title (set AI keyword to check)",
  TAGS_IDEAL: "Exactly 4 tags (2 reach + 2 stack-specific)",
  TAGS_PARTIAL: (count: number) => `${count} tag(s) — DEV.to allows up to 4, aim for exactly 4`,
  TAGS_GOOGLE_OK: (count: number) => `${count} topical SEO tags (aim 3-5)`,
  TAGS_GOOGLE_PARTIAL: (count: number) => `${count} tag(s) — aim for 3-5 topical SEO tags`,
  TAGS_NO_REACH: "No high-reach tag (add webdev, programming, or tutorial)",
  TAGS_HAS_REACH: "Includes high-reach DEV.to feed tag",
  NO_TAGS: "No tags",
  HAS_COVER: "Cover / featured image set",
  COVER_PUBLIC: "Cover is a public URL",
  COVER_NOT_PUBLIC: "Cover must be a public URL — upload before publishing",
  NO_COVER: "No cover image",
  CANONICAL_SET: "Canonical URL set",
  NO_CANONICAL: "No canonical URL",
  META_LENGTH_OK: "Meta description length (120-160 chars, snippet-ready)",
  META_LENGTH_TOO_SHORT: (len: number) => `Meta description too short (${len} chars, aim 120-160)`,
  META_LENGTH_TOO_LONG: (len: number) => `Meta description too long (${len} chars, max 160)`,
  NO_CONTENT_META: "No meta description",
  META_OPEN_POST: "Meta description (open post to check)",
  META_UNIQUE_OK: "Meta description differs from title",
  META_UNIQUE_FAIL: "Meta description is too similar to the title",
  HAS_INTERNAL_LINKS: "Has internal links",
  NO_INTERNAL_LINKS: "No internal links",
  LINKS_OPEN_POST: "Internal links (open post to check)",
  HAS_AUTHORITY: "Authority cue (repo/demo link or code sample)",
  NO_AUTHORITY: "No repo/demo link or code sample in content",
  HAS_TROUBLESHOOTING: "Troubleshooting / Common Errors section",
  NO_TROUBLESHOOTING: "Missing Troubleshooting section",
  HAS_DISCUSSION: "Discussion question (DEV comment boost)",
  NO_DISCUSSION: "No discussion question — DEV ranks comments highly",
  HAS_DIRECT_ANSWER: "Direct answer under first H2 (snippet-ready)",
  NO_DIRECT_ANSWER: "Missing direct answer (~35-50 words) under first H2",
  HEADINGS_OK: "Clear ## heading outline (2+ H2s)",
  HEADINGS_WEAK: "Add at least two distinct ## headings",
  QUERY_INTRO_OK: "Primary keyword appears early in the body",
  QUERY_INTRO_MISSING: "Primary keyword missing from the intro",
  QUERY_INTRO_NA: "Primary keyword in intro (set AI keyword to check)",
  ANTI_STUFFING_OK: "No repeated phrase stuffing detected",
  ANTI_STUFFING_FAIL: "Same phrase repeats too often — reduce stuffing risk",
  IMAGE_ALT_OK: "Inline images have descriptive alt text",
  IMAGE_ALT_FAIL: "One or more images missing descriptive alt text",
  IMAGE_ALT_NA: "No inline images (alt N/A)",
  SCHEMA_READY_OK: "Schema-ready fields (title, meta, cover, canonical)",
  SCHEMA_READY_FAIL: "Missing fields for BlogPosting schema readiness",
  CONTENT_OPEN_POST: "Content checks (open post to evaluate)",
} as const);

export const SEO_PUBLISH_WARNINGS = Object.freeze({
  NO_META: "Meta description missing — Google and DEV previews will be weak",
  NO_COVER: "No public cover image — upload via AI modal before publishing",
  COVER_NOT_PUBLIC: "Cover is not a public URL — use Upload & Save before publishing",
  FEW_TAGS: "Use exactly 4 tags (2 high-reach + 2 stack-specific) for DEV feeds",
  NO_DISCUSSION: "Add a discussion question at the end to boost DEV engagement",
  LOW_SEO: (score: number) => `SEO score is ${score}/100 — fix warnings in the sidebar before publishing`,
  NO_ALT: "Add descriptive alt text to inline images before publishing",
  WEAK_STRUCTURE: "Improve heading outline and direct-answer block for Google SEO",
} as const);

export const INTERNAL_LINK_FALLBACK_ORIGINS = Object.freeze(["localhost"] as const);

export const AUTHORITY_LINK_HOSTS = Object.freeze(["github.com", "gitlab.com", "bitbucket.org"] as const);

export const SEO_ALT_DENYLIST = Object.freeze([
  "image",
  "photo",
  "picture",
  "img",
  "cover",
  "banner",
  "untitled",
] as const);

/** Markdown / HTML markers used by scorecard parsers (avoid ReDoS-prone regex). */
export const SEO_MARKDOWN = Object.freeze({
  ATX_MAX_LEVEL: 6,
  STUFFING_HEADING_MAX_LEVEL: 3,
  H2_LEVEL: 2,
  IMAGE_OPEN: "![",
  LINK_CLOSE_OPEN: "](",
  ANCHOR_TAG: "<a",
  IMG_TAG: "<img",
  HREF_ATTR: "href",
  ALT_ATTR: "alt",
  HTTP_PREFIX: "http://",
  HTTPS_PREFIX: "https://",
  PATH_PREFIX: "/",
  FENCE: "```",
} as const);

/** Persisted summary line prefixes — keep in sync with client/src/constants/seo.ts */
export const SEO_SUMMARY_PREFIX = Object.freeze({
  OK: "OK ",
  WARN: "WARN ",
  FAIL: "FAIL ",
} as const);

/** Keep in sync with client/src/constants/seo.ts SEO_IMPROVE_* */
export const SEO_IMPROVE_FIELDS = Object.freeze({
  TITLE: "title",
  META_DESCRIPTION: "meta_description",
  TAGS: "tags",
  CANONICAL_URL: "canonical_url",
  CONTENT: "content",
} as const);

export const SEO_IMPROVE_APPLY = Object.freeze({
  REPLACE: "replace",
  APPEND: "append",
} as const);

/**
 * Snippet size caps for SEO improve (pack on client, clamp on server).
 * Keep in sync with client/src/constants/seo.ts SEO_IMPROVE_LIMITS.
 */
export const SEO_IMPROVE_LIMITS = Object.freeze({
  INTRO_CHARS: 900,
  STUFFING_SCAN_CHARS: 2000,
  SURROUNDING_CHARS: 400,
  /** Hard API ceiling for currentValue — must be >= STUFFING_SCAN_CHARS. */
  CURRENT_VALUE_MAX: 4000,
  ISSUE_MAX: 240,
  PRIMARY_KEYWORD_MAX: 120,
  TITLE_CONTEXT_MAX: 200,
  MAX_TARGETS: 12,
  /** Join delimiter when packing tags into currentValue (AI returns the same shape). */
  TAGS_JOIN: ", ",
} as const);
