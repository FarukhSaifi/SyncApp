/**
 * SEO Scorecard - computes a 0-100 score and checklist from post data.
 * Aligned with DEV.to feed ranking + Google Search visibility guidelines.
 *
 * Intentionally word-count-neutral: short, dense posts score the same as long posts
 * when metadata, structure, and authority signals are present.
 */
import type { Post, SeoCheck, SeoScorecard } from "@types";

import {
  AUTHORITY_LINK_HOSTS,
  DEVTO_HIGH_REACH_TAGS,
  DEVTO_PUBLISH_WARNINGS,
  INTERNAL_LINK_ORIGINS,
  SEO_CHECK_LABELS,
  SEO_THRESHOLDS,
  SEO_WEIGHTS,
} from "@constants/seo";

const {
  TITLE_MIN,
  TITLE_MAX,
  META_DESC_MIN,
  META_DESC_MAX,
  TAG_COUNT_IDEAL,
  SCORE_MAX,
  SCORE_WITHOUT_CONTENT_DIVISOR,
} = SEO_THRESHOLDS;

/** Count internal links (relative or same-origin) in HTML or markdown */
function countInternalLinks(content: string): number {
  if (!content || typeof content !== "string") return 0;
  const html = content.trim();
  const mdRe = /\[[^\]]*\]\((https?:\/\/[^)]+|\/[^)]*)\)/g;
  const aRe = /<a\s[^>]*href=["'](https?:\/\/[^"']+|\/[^"']*)["']/gi;
  let count = 0;
  let m: RegExpExecArray | null;
  const isInternal = (url: string): boolean =>
    url.startsWith("/") || INTERNAL_LINK_ORIGINS.some((origin) => url.includes(origin));
  while ((m = mdRe.exec(html)) !== null) {
    if (isInternal(m[1])) count++;
  }
  while ((m = aRe.exec(html)) !== null) {
    if (isInternal(m[1])) count++;
  }
  return count;
}

function hasAuthorityLink(content: string): boolean {
  if (!content) return false;
  const lower = content.toLowerCase();
  return AUTHORITY_LINK_HOSTS.some((host) => lower.includes(host));
}

function hasTroubleshootingSection(content: string): boolean {
  if (!content) return false;
  return /(^|\n)#+\s*(troubleshooting|common\s+errors?|debugging|pitfalls)/i.test(content);
}

function hasDiscussionQuestion(content: string): boolean {
  if (!content) return false;
  if (/(^|\n)#+\s*discussion/i.test(content)) return true;
  const tail = content.trim().slice(-600);
  return /\?\s*$/.test(tail) || /\?\s*\n/.test(tail);
}

function hasDirectAnswerBlock(content: string): boolean {
  if (!content) return false;
  const intro = content.trim().slice(0, 1200);
  const firstH2 = intro.search(/\n##\s+/);
  const beforeFirstSection = firstH2 > 0 ? intro.slice(0, firstH2) : intro.slice(0, 600);
  const sentences = beforeFirstSection.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  return sentences.length >= 2;
}

function isPublicCoverUrl(cover: string): boolean {
  const trimmed = cover.trim();
  if (!trimmed || trimmed.startsWith("data:")) return false;
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

type MetaDescriptionStatus = "ok" | "too_short" | "too_long" | "missing";

/** Single source of truth for meta description length — used by checks and scoring. */
function getMetaDescriptionStatus(metaLen: number): MetaDescriptionStatus {
  if (metaLen === 0) return "missing";
  if (metaLen >= META_DESC_MIN && metaLen <= META_DESC_MAX) return "ok";
  if (metaLen > META_DESC_MAX) return "too_long";
  return "too_short";
}

function getMetaDescriptionScore(status: MetaDescriptionStatus): number {
  if (status === "ok") return SEO_WEIGHTS.META_FULL;
  if (status === "too_short") return SEO_WEIGHTS.META_PARTIAL;
  return 0;
}

export function getSeoScorecard(post: Partial<Post>): SeoScorecard {
  if (!post) return { score: 0, maxScore: SCORE_MAX, checks: [] };

  const title = (post.title || "").trim();
  const titleLen = title.length;
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const coverRaw = (post.cover_image || "").trim();
  const hasCover = Boolean(coverRaw);
  const coverPublic = hasCover && isPublicCoverUrl(coverRaw);
  const hasCanonical = Boolean(post.canonical_url && post.canonical_url.trim());
  const content = post.content_markdown || "";
  const metaLen = (post.meta_description || "").trim().length;
  const metaStatus = getMetaDescriptionStatus(metaLen);
  const internalLinks = countInternalLinks(content);
  const hasContent = content.length > 0;
  const tagsIdeal = tags.length === TAG_COUNT_IDEAL;
  const hasReachTag = tags.length > 0 && hasHighReachTag(tags);
  const hasRepoLink = hasAuthorityLink(content);
  const hasTroubleshooting = hasTroubleshootingSection(content);
  const hasDiscussion = hasDiscussionQuestion(content);
  const hasDirectAnswer = hasDirectAnswerBlock(content);

  const checks: SeoCheck[] = [];

  const titleOk = titleLen >= TITLE_MIN && titleLen <= TITLE_MAX;
  if (titleLen === 0) {
    checks.push({ label: SEO_CHECK_LABELS.TITLE_MISSING, ok: false });
  } else if (titleOk) {
    checks.push({ label: SEO_CHECK_LABELS.TITLE_OK, ok: true });
  } else {
    checks.push({
      label:
        titleLen < TITLE_MIN ? SEO_CHECK_LABELS.TITLE_TOO_SHORT(titleLen) : SEO_CHECK_LABELS.TITLE_TOO_LONG(titleLen),
      ok: false,
      warning: true,
    });
  }

  if (tagsIdeal) {
    checks.push({ label: SEO_CHECK_LABELS.TAGS_IDEAL, ok: true });
  } else if (tags.length > 0) {
    checks.push({
      label: SEO_CHECK_LABELS.TAGS_PARTIAL(tags.length),
      ok: false,
      warning: true,
    });
  } else {
    checks.push({ label: SEO_CHECK_LABELS.NO_TAGS, ok: false, warning: true });
  }

  if (tags.length > 0) {
    if (hasReachTag) {
      checks.push({ label: SEO_CHECK_LABELS.TAGS_HAS_REACH, ok: true });
    } else {
      checks.push({ label: SEO_CHECK_LABELS.TAGS_NO_REACH, ok: false, warning: true });
    }
  }

  if (hasCover) {
    checks.push({ label: SEO_CHECK_LABELS.HAS_COVER, ok: true });
    if (coverPublic) {
      checks.push({ label: SEO_CHECK_LABELS.COVER_PUBLIC, ok: true });
    } else {
      checks.push({ label: SEO_CHECK_LABELS.COVER_NOT_PUBLIC, ok: false, warning: true });
    }
  } else {
    checks.push({ label: SEO_CHECK_LABELS.NO_COVER, ok: false, warning: true });
  }

  if (hasCanonical) {
    checks.push({ label: SEO_CHECK_LABELS.CANONICAL_SET, ok: true });
  } else {
    checks.push({ label: SEO_CHECK_LABELS.NO_CANONICAL, ok: false, warning: true });
  }

  if (hasContent) {
    if (metaStatus === "ok") {
      checks.push({ label: SEO_CHECK_LABELS.META_LENGTH_OK, ok: true });
    } else if (metaStatus === "too_short") {
      checks.push({
        label: SEO_CHECK_LABELS.META_LENGTH_TOO_SHORT(metaLen),
        ok: false,
        warning: true,
      });
    } else if (metaStatus === "too_long") {
      checks.push({
        label: SEO_CHECK_LABELS.META_LENGTH_TOO_LONG(metaLen),
        ok: false,
        warning: true,
      });
    } else {
      checks.push({ label: SEO_CHECK_LABELS.NO_CONTENT_META, ok: false, warning: true });
    }
  } else {
    checks.push({ label: SEO_CHECK_LABELS.META_OPEN_POST, ok: null, warning: false });
  }

  if (hasContent) {
    if (internalLinks > 0) {
      checks.push({ label: SEO_CHECK_LABELS.HAS_INTERNAL_LINKS, ok: true });
    } else {
      checks.push({ label: SEO_CHECK_LABELS.NO_INTERNAL_LINKS, ok: false, warning: true });
    }

    if (hasRepoLink) {
      checks.push({ label: SEO_CHECK_LABELS.HAS_REPO_LINK, ok: true });
    } else {
      checks.push({ label: SEO_CHECK_LABELS.NO_REPO_LINK, ok: false, warning: true });
    }

    if (hasTroubleshooting) {
      checks.push({ label: SEO_CHECK_LABELS.HAS_TROUBLESHOOTING, ok: true });
    } else {
      checks.push({ label: SEO_CHECK_LABELS.NO_TROUBLESHOOTING, ok: false, warning: true });
    }

    if (hasDiscussion) {
      checks.push({ label: SEO_CHECK_LABELS.HAS_DISCUSSION, ok: true });
    } else {
      checks.push({ label: SEO_CHECK_LABELS.NO_DISCUSSION, ok: false, warning: true });
    }

    if (hasDirectAnswer) {
      checks.push({ label: SEO_CHECK_LABELS.HAS_DIRECT_ANSWER, ok: true });
    } else {
      checks.push({ label: SEO_CHECK_LABELS.NO_DIRECT_ANSWER, ok: false, warning: true });
    }
  } else {
    checks.push({ label: SEO_CHECK_LABELS.LINKS_OPEN_POST, ok: null, warning: false });
  }

  const titleScore =
    titleLen >= TITLE_MIN && titleLen <= TITLE_MAX ? SEO_WEIGHTS.TITLE : titleLen > 0 ? SEO_WEIGHTS.TITLE_PARTIAL : 0;
  const tagsScore = tagsIdeal ? SEO_WEIGHTS.TAGS : tags.length > 0 ? SEO_WEIGHTS.TAGS_PARTIAL : 0;
  const coverScore = hasCover ? SEO_WEIGHTS.COVER : 0;
  const coverPublicScore = coverPublic ? SEO_WEIGHTS.COVER_PUBLIC : 0;
  const canonicalScore = hasCanonical ? SEO_WEIGHTS.CANONICAL : 0;
  let metaScore = 0;
  let linksScore = 0;
  let repoScore = 0;
  let troubleshootingScore = 0;
  let discussionScore = 0;
  let directAnswerScore = 0;
  if (hasContent) {
    metaScore = getMetaDescriptionScore(metaStatus);
    linksScore = internalLinks > 0 ? SEO_WEIGHTS.INTERNAL_LINKS : 0;
    repoScore = hasRepoLink ? SEO_WEIGHTS.REPO_LINK : 0;
    troubleshootingScore = hasTroubleshooting ? SEO_WEIGHTS.TROUBLESHOOTING : 0;
    discussionScore = hasDiscussion ? SEO_WEIGHTS.DISCUSSION : 0;
    directAnswerScore = hasDirectAnswer ? SEO_WEIGHTS.DIRECT_ANSWER : 0;
  }
  const score =
    titleScore +
    tagsScore +
    coverScore +
    coverPublicScore +
    canonicalScore +
    metaScore +
    linksScore +
    repoScore +
    troubleshootingScore +
    discussionScore +
    directAnswerScore;
  const displayScore = hasContent ? score : Math.round((score / SCORE_WITHOUT_CONTENT_DIVISOR) * SCORE_MAX);

  return {
    score: displayScore,
    maxScore: SCORE_MAX,
    checks,
    summary: checks
      .filter((c) => c.ok !== null)
      .map((c) => (c.ok ? `✅ ${c.label}` : c.warning ? `⚠️ ${c.label}` : `❌ ${c.label}`))
      .join("\n"),
  };
}

/** Actionable warnings before publishing to DEV.to */
export function getDevtoPublishWarnings(post: Partial<Post>): string[] {
  const warnings: string[] = [];
  const scorecard = getSeoScorecard(post);
  const cover = (post.cover_image || "").trim();
  const metaLen = (post.meta_description || "").trim().length;
  const tags = Array.isArray(post.tags) ? post.tags : [];

  if (metaLen === 0) warnings.push(DEVTO_PUBLISH_WARNINGS.NO_META);
  if (!cover) warnings.push(DEVTO_PUBLISH_WARNINGS.NO_COVER);
  else if (!isPublicCoverUrl(cover)) warnings.push(DEVTO_PUBLISH_WARNINGS.COVER_NOT_PUBLIC);
  if (tags.length !== TAG_COUNT_IDEAL) warnings.push(DEVTO_PUBLISH_WARNINGS.FEW_TAGS);
  if (!hasDiscussionQuestion(post.content_markdown || "")) warnings.push(DEVTO_PUBLISH_WARNINGS.NO_DISCUSSION);
  if (scorecard.score < 60) warnings.push(DEVTO_PUBLISH_WARNINGS.LOW_SEO(scorecard.score));

  return warnings;
}
