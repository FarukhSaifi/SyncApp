/**
 * SEO Scorecard - computes a 0-100 score and checklist from post data.
 * Uses title, tags, cover_image, canonical_url; optional content_markdown for meta description and internal links.
 */
import { INTERNAL_LINK_ORIGINS, SEO_CHECK_LABELS, SEO_THRESHOLDS, SEO_WEIGHTS } from "@constants/seo";
import type { Post } from "@types";

const { TITLE_MIN, TITLE_MAX, META_DESC_MIN, META_DESC_CAP, SCORE_MAX, SCORE_WITHOUT_CONTENT_DIVISOR } = SEO_THRESHOLDS;

export interface SeoCheck {
  label: string;
  ok: boolean | null;
  warning?: boolean;
}

export interface SeoScorecard {
  score: number;
  maxScore: number;
  checks: SeoCheck[];
  summary?: string;
}

/** Strip HTML tags to get plain text */
function stripHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

export function getSeoScorecard(post: Partial<Post>): SeoScorecard {
  if (!post) return { score: 0, maxScore: SCORE_MAX, checks: [] };

  const title = (post.title || "").trim();
  const titleLen = title.length;
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const hasCover = Boolean(post.cover_image && post.cover_image.trim());
  const hasCanonical = Boolean(post.canonical_url && post.canonical_url.trim());
  const content = post.content_markdown || "";
  const plainText = stripHtml(content);
  const metaLen = plainText.length;
  const internalLinks = countInternalLinks(content);
  const hasContent = content.length > 0;

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

  if (tags.length > 0) {
    checks.push({ label: SEO_CHECK_LABELS.HAS_TAGS, ok: true });
  } else {
    checks.push({ label: SEO_CHECK_LABELS.NO_TAGS, ok: false, warning: true });
  }

  if (hasCover) {
    checks.push({ label: SEO_CHECK_LABELS.HAS_COVER, ok: true });
  } else {
    checks.push({ label: SEO_CHECK_LABELS.NO_COVER, ok: false, warning: true });
  }

  if (hasCanonical) {
    checks.push({ label: SEO_CHECK_LABELS.CANONICAL_SET, ok: true });
  } else {
    checks.push({ label: SEO_CHECK_LABELS.NO_CANONICAL, ok: false, warning: true });
  }

  if (hasContent) {
    if (metaLen >= META_DESC_MIN && metaLen <= META_DESC_CAP) {
      checks.push({ label: SEO_CHECK_LABELS.META_LENGTH_OK, ok: true });
    } else if (metaLen > 0) {
      checks.push({
        label: SEO_CHECK_LABELS.META_LENGTH_BAD(metaLen),
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
  } else {
    checks.push({ label: SEO_CHECK_LABELS.LINKS_OPEN_POST, ok: null, warning: false });
  }

  let score = 0;
  const titleScore =
    titleLen >= TITLE_MIN && titleLen <= TITLE_MAX ? SEO_WEIGHTS.TITLE : titleLen > 0 ? SEO_WEIGHTS.TITLE_PARTIAL : 0;
  const tagsScore = tags.length > 0 ? SEO_WEIGHTS.TAGS : 0;
  const coverScore = hasCover ? SEO_WEIGHTS.COVER : 0;
  const canonicalScore = hasCanonical ? SEO_WEIGHTS.CANONICAL : 0;
  let metaScore = 0;
  let linksScore = 0;
  if (hasContent) {
    metaScore =
      metaLen >= META_DESC_MIN && metaLen <= META_DESC_CAP
        ? SEO_WEIGHTS.META_FULL
        : metaLen > 0
          ? SEO_WEIGHTS.META_PARTIAL
          : 0;
    linksScore = internalLinks > 0 ? SEO_WEIGHTS.INTERNAL_LINKS : 0;
  }
  score = titleScore + tagsScore + coverScore + canonicalScore + metaScore + linksScore;
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
