/**
 * SEO Scorecard — server source of truth for persisted seo_score.
 * Keep scoring rules in sync with client/src/utils/seoScorecard.ts.
 */
import { config } from "@config";
import type { SeoCheck, SeoScorecard, SeoScorecardContext, SeoScorePersistFields } from "@types";

import {
  AUTHORITY_LINK_HOSTS,
  DEVTO_HIGH_REACH_TAGS,
  INTERNAL_LINK_FALLBACK_ORIGINS,
  SEO_ALT_DENYLIST,
  SEO_CATEGORIES,
  SEO_CHECK_LABELS,
  SEO_PUBLISH_WARNINGS,
  SEO_SUMMARY_PREFIX,
  SEO_THRESHOLDS,
  SEO_WEIGHTS,
  type SeoCategoryId,
} from "@constants/seo";

type MetaDescriptionStatus = "ok" | "too_short" | "too_long" | "missing";

type ScoreablePost = {
  title?: string;
  content_markdown?: string;
  meta_description?: string | null;
  cover_image?: string | null;
  canonical_url?: string | null;
  slug?: string | null;
  tags?: string[];
};

const {
  TITLE_MIN,
  TITLE_MAX,
  META_DESC_MIN,
  META_DESC_MAX,
  TAG_COUNT_IDEAL,
  TAG_COUNT_GOOGLE_MIN,
  TAG_COUNT_GOOGLE_IDEAL,
  SCORE_MAX,
  SCORE_WITHOUT_CONTENT_DIVISOR,
} = SEO_THRESHOLDS;

function normalizeKeyword(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function includesKeyword(haystack: string, keyword: string): boolean {
  const needle = normalizeKeyword(keyword);
  if (!needle) {
    return false;
  }
  return normalizeKeyword(haystack).includes(needle);
}

function resolveIncludesDev(platforms?: string[]): boolean {
  if (!platforms || platforms.length === 0) {
    return true;
  }
  return platforms.some((p) => p.trim().toLowerCase() === "devto");
}

function getInternalLinkOrigins(): string[] {
  const origins: string[] = [...INTERNAL_LINK_FALLBACK_ORIGINS];
  const base = (config.canonicalBaseUrl || "").trim();
  if (!base) {
    return origins;
  }
  try {
    const url = new URL(base.startsWith("http") ? base : `https://${base}`);
    if (url.hostname) {
      origins.push(url.hostname);
    }
  } catch {
    // Ignore invalid configured base; fallbacks still apply.
  }
  return origins;
}

function countInternalLinks(content: string): number {
  if (!content || typeof content !== "string") {
    return 0;
  }
  const html = content.trim();
  const mdRe = /\[[^\]]*\]\((https?:\/\/[^)]+|\/[^)]*)\)/g;
  const aRe = /<a\s[^>]*href=["'](https?:\/\/[^"']+|\/[^"']*)["']/gi;
  let count = 0;
  let m: RegExpExecArray | null;
  const origins = getInternalLinkOrigins();
  const isInternal = (url: string): boolean => url.startsWith("/") || origins.some((origin) => url.includes(origin));
  while ((m = mdRe.exec(html)) !== null) {
    if (isInternal(m[1])) {
      count++;
    }
  }
  while ((m = aRe.exec(html)) !== null) {
    if (isInternal(m[1])) {
      count++;
    }
  }
  return count;
}

function hasAuthorityLink(content: string): boolean {
  if (!content) {
    return false;
  }
  const lower = content.toLowerCase();
  return AUTHORITY_LINK_HOSTS.some((host) => lower.includes(host));
}

function hasCodeArtifact(content: string): boolean {
  if (!content) {
    return false;
  }
  return /```[\s\S]*?```/.test(content) || /(?:^|\n)\s{0,3}(?:\$|npm |npx |yarn |pnpm |git )/m.test(content);
}

function hasAuthorityCue(content: string): boolean {
  return hasAuthorityLink(content) || hasCodeArtifact(content);
}

function hasTroubleshootingSection(content: string): boolean {
  if (!content) {
    return false;
  }
  return /(^|\n)#+\s*(troubleshooting|common\s+errors?|debugging|pitfalls)/i.test(content);
}

function hasDiscussionQuestion(content: string): boolean {
  if (!content) {
    return false;
  }
  if (/(^|\n)#+\s*discussion/i.test(content)) {
    return true;
  }
  const tail = content.trim().slice(-SEO_THRESHOLDS.DISCUSSION_TAIL_CHARS);
  return /\?\s*$/.test(tail) || /\?\s*\n/.test(tail);
}

function extractFirstH2Block(content: string): string {
  const trimmed = content.trim();
  const h2Match = trimmed.match(/\n##\s+[^\n]+\n([\s\S]*?)(?=\n##\s+|$)/);
  if (h2Match?.[1]) {
    return h2Match[1].trim();
  }
  const intro = trimmed.slice(0, SEO_THRESHOLDS.DIRECT_ANSWER_INTRO_CHARS);
  const firstH2 = intro.search(/\n##\s+/);
  if (firstH2 > 0) {
    return intro.slice(0, firstH2).trim();
  }
  return intro.slice(0, SEO_THRESHOLDS.DIRECT_ANSWER_BEFORE_H2_FALLBACK_CHARS).trim();
}

function hasDirectAnswerBlock(content: string): boolean {
  if (!content) {
    return false;
  }
  const block = extractFirstH2Block(content);
  const prose = block
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = prose.split(/\s+/).filter(Boolean);
  if (words.length < SEO_THRESHOLDS.DIRECT_ANSWER_MIN_WORDS || words.length > SEO_THRESHOLDS.DIRECT_ANSWER_MAX_WORDS) {
    return false;
  }
  const sentences = prose
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > SEO_THRESHOLDS.DIRECT_ANSWER_MIN_SENTENCE_CHARS);
  return sentences.length >= SEO_THRESHOLDS.DIRECT_ANSWER_MIN_SENTENCES;
}

function getHeadingStats(content: string): { h2Count: number; hasDuplicateH2: boolean } {
  const lines = content.split(/\n/);
  const h2Texts: string[] = [];
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      h2Texts.push(h2[1].trim().toLowerCase());
    }
  }
  const hasDuplicateH2 = h2Texts.some((text, i) => i > 0 && text === h2Texts[i - 1]);
  return { h2Count: h2Texts.length, hasDuplicateH2 };
}

function hasHealthyHeadingOutline(content: string): boolean {
  const stats = getHeadingStats(content);
  return stats.h2Count >= SEO_THRESHOLDS.MIN_H2_COUNT && !stats.hasDuplicateH2;
}

function tokenizeForNgrams(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function hasPhraseStuffing(title: string, content: string): boolean {
  const headings = (content.match(/^#{1,3}\s+.+$/gm) || []).join(" ");
  const scan = `${title}\n${headings}\n${content.slice(0, SEO_THRESHOLDS.STUFFING_SCAN_CHARS)}`;
  const tokens = tokenizeForNgrams(scan);
  const size = SEO_THRESHOLDS.STUFFING_NGRAM_SIZE;
  if (tokens.length < size) {
    return false;
  }
  const counts = new Map<string, number>();
  for (let i = 0; i <= tokens.length - size; i++) {
    const gram = tokens.slice(i, i + size).join(" ");
    const next = (counts.get(gram) || 0) + 1;
    counts.set(gram, next);
    if (next >= SEO_THRESHOLDS.STUFFING_MAX_REPEATS) {
      return true;
    }
  }
  return false;
}

function analyzeImageAlts(content: string): { total: number; missingOrWeak: number } {
  if (!content) {
    return { total: 0, missingOrWeak: 0 };
  }
  let total = 0;
  let missingOrWeak = 0;
  const mdImg = /!\[([^\]]*)\]\([^)]+\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdImg.exec(content)) !== null) {
    total++;
    const alt = (m[1] || "").trim().toLowerCase();
    if (!alt || SEO_ALT_DENYLIST.includes(alt as (typeof SEO_ALT_DENYLIST)[number])) {
      missingOrWeak++;
    }
  }
  const htmlImg = /<img\b[^>]*>/gi;
  while ((m = htmlImg.exec(content)) !== null) {
    total++;
    const tag = m[0];
    const altMatch = tag.match(/\balt\s*=\s*["']([^"']*)["']/i);
    const alt = (altMatch?.[1] || "").trim().toLowerCase();
    if (!alt || SEO_ALT_DENYLIST.includes(alt as (typeof SEO_ALT_DENYLIST)[number])) {
      missingOrWeak++;
    }
  }
  return { total, missingOrWeak };
}

function isPublicCoverUrl(cover: string): boolean {
  const trimmed = cover.trim();
  if (!trimmed || trimmed.startsWith("data:")) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function hasHighReachTag(tags: string[]): boolean {
  const normalized = tags.map((t) => t.trim().toLowerCase());
  return DEVTO_HIGH_REACH_TAGS.some((tag) => normalized.includes(tag));
}

function getMetaDescriptionStatus(metaLen: number): MetaDescriptionStatus {
  if (metaLen === 0) {
    return "missing";
  }
  if (metaLen >= META_DESC_MIN && metaLen <= META_DESC_MAX) {
    return "ok";
  }
  if (metaLen > META_DESC_MAX) {
    return "too_long";
  }
  return "too_short";
}

function getMetaDescriptionScore(status: MetaDescriptionStatus): number {
  if (status === "ok") {
    return SEO_WEIGHTS.META_FULL;
  }
  if (status === "too_short") {
    return SEO_WEIGHTS.META_PARTIAL;
  }
  return 0;
}

function isMetaUniqueFromTitle(title: string, meta: string): boolean {
  const t = normalizeKeyword(title);
  const m = normalizeKeyword(meta);
  if (!t || !m) {
    return false;
  }
  if (t === m) {
    return false;
  }
  const shorter = t.length <= m.length ? t : m;
  const longer = t.length <= m.length ? m : t;
  if (longer.includes(shorter) && shorter.length / longer.length >= SEO_THRESHOLDS.META_TITLE_SIMILARITY_RATIO) {
    return false;
  }
  return true;
}

function pushCheck(
  checks: SeoCheck[],
  category: SeoCategoryId,
  label: string,
  ok: boolean | null,
  warning = false,
): void {
  checks.push({ label, ok, warning: warning || undefined, category });
}

export function getSeoScorecard(
  post: ScoreablePost | null | undefined,
  context: SeoScorecardContext = {},
): SeoScorecard {
  if (!post) {
    return { score: 0, maxScore: SCORE_MAX, checks: [], categories: [] };
  }

  const includesDev = resolveIncludesDev(context.platforms);
  const primaryKeyword = (context.primaryKeyword || "").trim();
  const title = (post.title || "").trim();
  const titleLen = title.length;
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const coverRaw = (post.cover_image || "").trim();
  const hasCover = Boolean(coverRaw);
  const coverPublic = hasCover && isPublicCoverUrl(coverRaw);
  const hasCanonical = Boolean(
    (post.canonical_url && post.canonical_url.trim()) || (post.slug && String(post.slug).trim()),
  );
  const content = post.content_markdown || "";
  const metaRaw = (post.meta_description || "").trim();
  const metaLen = metaRaw.length;
  const metaStatus = getMetaDescriptionStatus(metaLen);
  const hasContent = content.length > 0;
  const checks: SeoCheck[] = [];

  // --- Metadata ---
  const titleOk = titleLen >= TITLE_MIN && titleLen <= TITLE_MAX;
  if (titleLen === 0) {
    pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.TITLE_MISSING, false);
  } else if (titleOk) {
    pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.TITLE_OK, true);
  } else {
    pushCheck(
      checks,
      SEO_CATEGORIES.METADATA,
      titleLen < TITLE_MIN ? SEO_CHECK_LABELS.TITLE_TOO_SHORT(titleLen) : SEO_CHECK_LABELS.TITLE_TOO_LONG(titleLen),
      false,
      true,
    );
  }

  if (primaryKeyword) {
    if (includesKeyword(title, primaryKeyword)) {
      pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.TITLE_QUERY_OK, true);
    } else {
      pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.TITLE_QUERY_MISSING, false, true);
    }
  } else {
    pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.TITLE_QUERY_NA, null);
  }

  if (hasCanonical) {
    pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.CANONICAL_SET, true);
  } else {
    pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.NO_CANONICAL, false, true);
  }

  if (hasContent || metaLen > 0) {
    if (metaStatus === "ok") {
      pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.META_LENGTH_OK, true);
    } else if (metaStatus === "too_short") {
      pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.META_LENGTH_TOO_SHORT(metaLen), false, true);
    } else if (metaStatus === "too_long") {
      pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.META_LENGTH_TOO_LONG(metaLen), false, true);
    } else {
      pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.NO_CONTENT_META, false, true);
    }
    if (metaLen > 0) {
      if (isMetaUniqueFromTitle(title, metaRaw)) {
        pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.META_UNIQUE_OK, true);
      } else {
        pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.META_UNIQUE_FAIL, false, true);
      }
    }
  } else {
    pushCheck(checks, SEO_CATEGORIES.METADATA, SEO_CHECK_LABELS.META_OPEN_POST, null);
  }

  // --- Structure ---
  let internalLinks = 0;
  let imageAlts = { total: 0, missingOrWeak: 0 };
  let hasDirectAnswer = false;
  let hasHeadings = false;
  let hasAuthority = false;
  let stuffing = false;
  let queryInIntro = false;

  if (hasContent) {
    internalLinks = countInternalLinks(content);
    imageAlts = analyzeImageAlts(content);
    hasDirectAnswer = hasDirectAnswerBlock(content);
    hasHeadings = hasHealthyHeadingOutline(content);
    hasAuthority = hasAuthorityCue(content);
    stuffing = hasPhraseStuffing(title, content);
    queryInIntro = primaryKeyword
      ? includesKeyword(content.slice(0, SEO_THRESHOLDS.QUERY_INTRO_CHARS), primaryKeyword)
      : true;

    if (hasDirectAnswer) {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.HAS_DIRECT_ANSWER, true);
    } else {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.NO_DIRECT_ANSWER, false, true);
    }

    if (hasHeadings) {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.HEADINGS_OK, true);
    } else {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.HEADINGS_WEAK, false, true);
    }

    if (primaryKeyword) {
      if (queryInIntro) {
        pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.QUERY_INTRO_OK, true);
      } else {
        pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.QUERY_INTRO_MISSING, false, true);
      }
    } else {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.QUERY_INTRO_NA, null);
    }

    if (!stuffing) {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.ANTI_STUFFING_OK, true);
    } else {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.ANTI_STUFFING_FAIL, false, true);
    }

    if (imageAlts.total === 0) {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.IMAGE_ALT_NA, true);
    } else if (imageAlts.missingOrWeak === 0) {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.IMAGE_ALT_OK, true);
    } else {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.IMAGE_ALT_FAIL, false, true);
    }

    if (internalLinks > 0) {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.HAS_INTERNAL_LINKS, true);
    } else {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.NO_INTERNAL_LINKS, false, true);
    }

    if (hasAuthority) {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.HAS_AUTHORITY, true);
    } else {
      pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.NO_AUTHORITY, false, true);
    }
  } else {
    pushCheck(checks, SEO_CATEGORIES.STRUCTURE, SEO_CHECK_LABELS.CONTENT_OPEN_POST, null);
  }

  // --- Trust ---
  if (hasCover) {
    pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.HAS_COVER, true);
    if (coverPublic) {
      pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.COVER_PUBLIC, true);
    } else {
      pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.COVER_NOT_PUBLIC, false, true);
    }
  } else {
    pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.NO_COVER, false, true);
  }

  const schemaReady = Boolean(title && metaRaw && coverPublic && hasCanonical);
  if (schemaReady) {
    pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.SCHEMA_READY_OK, true);
  } else {
    pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.SCHEMA_READY_FAIL, false, true);
  }

  if (includesDev) {
    if (tags.length === TAG_COUNT_IDEAL) {
      pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.TAGS_IDEAL, true);
    } else if (tags.length > 0) {
      pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.TAGS_PARTIAL(tags.length), false, true);
    } else {
      pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.NO_TAGS, false, true);
    }
    if (tags.length > 0) {
      if (hasHighReachTag(tags)) {
        pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.TAGS_HAS_REACH, true);
      } else {
        pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.TAGS_NO_REACH, false, true);
      }
    }
  } else {
    if (tags.length >= TAG_COUNT_GOOGLE_MIN && tags.length <= TAG_COUNT_GOOGLE_IDEAL) {
      pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.TAGS_GOOGLE_OK(tags.length), true);
    } else if (tags.length > 0) {
      pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.TAGS_GOOGLE_PARTIAL(tags.length), false, true);
    } else {
      pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.NO_TAGS, false, true);
    }
  }

  if (hasContent) {
    if (hasTroubleshootingSection(content)) {
      pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.HAS_TROUBLESHOOTING, true);
    } else {
      pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.NO_TROUBLESHOOTING, false, true);
    }
    if (includesDev) {
      if (hasDiscussionQuestion(content)) {
        pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.HAS_DISCUSSION, true);
      } else {
        pushCheck(checks, SEO_CATEGORIES.TRUST, SEO_CHECK_LABELS.NO_DISCUSSION, false, true);
      }
    }
  }

  // --- Score ---
  const titleScore =
    titleLen >= TITLE_MIN && titleLen <= TITLE_MAX ? SEO_WEIGHTS.TITLE : titleLen > 0 ? SEO_WEIGHTS.TITLE_PARTIAL : 0;
  const titleQueryScore = !primaryKeyword || includesKeyword(title, primaryKeyword) ? SEO_WEIGHTS.TITLE_QUERY : 0;
  const canonicalScore = hasCanonical ? SEO_WEIGHTS.CANONICAL : 0;
  let metaScore = 0;
  let metaUniqueScore = 0;
  let directAnswerScore = 0;
  let headingsScore = 0;
  let queryIntroScore = 0;
  let antiStuffingScore = 0;
  let imageAltScore = 0;
  let linksScore = 0;
  let authorityScore = 0;
  let troubleshootingScore = 0;
  let discussionScore = 0;

  if (hasContent || metaLen > 0) {
    metaScore = getMetaDescriptionScore(metaStatus);
    if (metaLen > 0 && isMetaUniqueFromTitle(title, metaRaw)) {
      metaUniqueScore = SEO_WEIGHTS.META_UNIQUE;
    }
  }

  if (hasContent) {
    const directAnswerMax = SEO_WEIGHTS.DIRECT_ANSWER + (includesDev ? 0 : SEO_WEIGHTS.DIRECT_ANSWER_NO_DEV_BOOST);
    const headingsMax = SEO_WEIGHTS.HEADINGS + (includesDev ? 0 : SEO_WEIGHTS.HEADINGS_NO_DEV_BOOST);
    directAnswerScore = hasDirectAnswer ? directAnswerMax : 0;
    headingsScore = hasHeadings ? headingsMax : 0;
    queryIntroScore = !primaryKeyword || queryInIntro ? SEO_WEIGHTS.QUERY_INTRO : 0;
    antiStuffingScore = stuffing ? 0 : SEO_WEIGHTS.ANTI_STUFFING;
    imageAltScore = imageAlts.missingOrWeak === 0 ? SEO_WEIGHTS.IMAGE_ALT : 0;
    linksScore = internalLinks > 0 ? SEO_WEIGHTS.INTERNAL_LINKS : 0;
    authorityScore = hasAuthority ? SEO_WEIGHTS.AUTHORITY : 0;
    troubleshootingScore = hasTroubleshootingSection(content) ? SEO_WEIGHTS.TROUBLESHOOTING : 0;
    if (includesDev) {
      discussionScore = hasDiscussionQuestion(content) ? SEO_WEIGHTS.DISCUSSION : 0;
    }
  }

  const coverScore = hasCover ? SEO_WEIGHTS.COVER : 0;
  const coverPublicScore = coverPublic ? SEO_WEIGHTS.COVER_PUBLIC : 0;
  const schemaScore = schemaReady ? SEO_WEIGHTS.SCHEMA_READY : 0;

  const tagsScore = includesDev
    ? (tags.length === TAG_COUNT_IDEAL ? SEO_WEIGHTS.TAGS : tags.length > 0 ? SEO_WEIGHTS.TAGS_PARTIAL : 0) +
      (tags.length > 0 && hasHighReachTag(tags) ? SEO_WEIGHTS.TAGS_REACH : 0)
    : tags.length >= TAG_COUNT_GOOGLE_MIN && tags.length <= TAG_COUNT_GOOGLE_IDEAL
      ? SEO_WEIGHTS.TAGS_GOOGLE
      : tags.length > 0
        ? SEO_WEIGHTS.TAGS_GOOGLE_PARTIAL
        : 0;

  const score =
    titleScore +
    titleQueryScore +
    metaScore +
    metaUniqueScore +
    canonicalScore +
    directAnswerScore +
    headingsScore +
    queryIntroScore +
    antiStuffingScore +
    imageAltScore +
    linksScore +
    authorityScore +
    coverScore +
    coverPublicScore +
    schemaScore +
    tagsScore +
    troubleshootingScore +
    discussionScore;

  const displayScore = hasContent ? score : Math.round((score / SCORE_WITHOUT_CONTENT_DIVISOR) * SCORE_MAX);

  const categories = (Object.values(SEO_CATEGORIES) as SeoCategoryId[]).map((id) => ({
    id,
    checks: checks.filter((c) => c.category === id),
  }));

  return {
    score: displayScore,
    maxScore: SCORE_MAX,
    checks,
    categories,
    summary: formatSeoScoreSummary(checks),
  };
}

function formatSeoScoreSummary(checks: SeoCheck[]): string {
  return checks
    .filter((c) => c.ok !== null)
    .map((c) =>
      c.ok
        ? `${SEO_SUMMARY_PREFIX.OK}${c.label}`
        : c.warning
          ? `${SEO_SUMMARY_PREFIX.WARN}${c.label}`
          : `${SEO_SUMMARY_PREFIX.FAIL}${c.label}`,
    )
    .join("\n");
}

/** Fields persisted on Post for dashboard list (no body required). */
export function buildPersistedSeoFields(post: ScoreablePost, context: SeoScorecardContext = {}): SeoScorePersistFields {
  const scorecard = getSeoScorecard(post, context);
  const primaryKeyword = (context.primaryKeyword || "").trim();
  const platforms = Array.isArray(context.platforms)
    ? context.platforms.map((p) => p.trim().toLowerCase()).filter(Boolean)
    : [];
  return {
    seo_score: scorecard.score,
    seo_score_summary: scorecard.summary || "",
    seo_primary_keyword: primaryKeyword,
    seo_optimization_targets: platforms,
  };
}

/** Soft pre-publish warnings for DEV.to and Google-oriented hygiene. */
export function getPublishSeoWarnings(post: ScoreablePost, context: SeoScorecardContext = {}): string[] {
  const warnings: string[] = [];
  const scorecard = getSeoScorecard(post, context);
  const cover = (post.cover_image || "").trim();
  const metaLen = (post.meta_description || "").trim().length;
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const includesDev = resolveIncludesDev(context.platforms);
  const content = post.content_markdown || "";
  const imageAlts = analyzeImageAlts(content);

  if (metaLen === 0) {
    warnings.push(SEO_PUBLISH_WARNINGS.NO_META);
  }
  if (!cover) {
    warnings.push(SEO_PUBLISH_WARNINGS.NO_COVER);
  } else if (!isPublicCoverUrl(cover)) {
    warnings.push(SEO_PUBLISH_WARNINGS.COVER_NOT_PUBLIC);
  }
  if (includesDev && tags.length !== TAG_COUNT_IDEAL) {
    warnings.push(SEO_PUBLISH_WARNINGS.FEW_TAGS);
  }
  if (includesDev && !hasDiscussionQuestion(content)) {
    warnings.push(SEO_PUBLISH_WARNINGS.NO_DISCUSSION);
  }
  if (imageAlts.total > 0 && imageAlts.missingOrWeak > 0) {
    warnings.push(SEO_PUBLISH_WARNINGS.NO_ALT);
  }
  if (
    content &&
    (!hasDirectAnswerBlock(content) || !hasHealthyHeadingOutline(content)) &&
    context.platforms?.some((p) => p.trim().toLowerCase() === "google")
  ) {
    warnings.push(SEO_PUBLISH_WARNINGS.WEAK_STRUCTURE);
  }
  if (scorecard.score < SEO_THRESHOLDS.PUBLISH_WARNING_SCORE_MIN) {
    warnings.push(SEO_PUBLISH_WARNINGS.LOW_SEO(scorecard.score));
  }

  return warnings;
}

/** @deprecated Prefer getPublishSeoWarnings */
export function getDevtoPublishWarnings(post: ScoreablePost): string[] {
  return getPublishSeoWarnings(post, { platforms: ["devto"] });
}
