/**
 * SEO Scorecard - computes a 0-100 score and checklist from post data.
 * Aligned with Google Search people-first guidance + DEV.to feed signals.
 *
 * Intentionally word-count-neutral and density-%-free.
 * Keep scoring rules in sync with server/src/services/seoScoreService.ts
 * (server persists seo_score for dashboard list views).
 */
import type { MetaDescriptionStatus, Post, SeoCheck, SeoScorecard, SeoScorecardContext } from "@types";

import { CANONICAL_BASE_URL } from "@constants/api";
import {
  AUTHORITY_LINK_HOSTS,
  DEVTO_HIGH_REACH_TAGS,
  INTERNAL_LINK_FALLBACK_ORIGINS,
  SEO_ALT_DENYLIST,
  SEO_CATEGORIES,
  SEO_CHECK_LABELS,
  SEO_MARKDOWN,
  SEO_PUBLISH_WARNINGS,
  SEO_SUMMARY_PREFIX,
  SEO_THRESHOLDS,
  SEO_WEIGHTS,
  type SeoCategoryId,
} from "@constants/seo";

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
  const base = (CANONICAL_BASE_URL || "").trim();
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

function isInternalUrl(url: string, origins: string[]): boolean {
  return url.startsWith(SEO_MARKDOWN.PATH_PREFIX) || origins.some((origin) => url.includes(origin));
}

function isHttpOrPathUrl(url: string): boolean {
  return (
    url.startsWith(SEO_MARKDOWN.HTTP_PREFIX) ||
    url.startsWith(SEO_MARKDOWN.HTTPS_PREFIX) ||
    url.startsWith(SEO_MARKDOWN.PATH_PREFIX)
  );
}

/** Linear scan for markdown links `[text](url)` (skips images). */
function forEachMarkdownLinkUrl(content: string, onUrl: (url: string) => void): void {
  let i = 0;
  while (i < content.length) {
    const open = content.indexOf("[", i);
    if (open < 0) {
      break;
    }
    if (open > 0 && content[open - 1] === "!") {
      i = open + 1;
      continue;
    }
    const close = content.indexOf("]", open + 1);
    if (close < 0) {
      break;
    }
    if (!content.startsWith(SEO_MARKDOWN.LINK_CLOSE_OPEN, close)) {
      i = open + 1;
      continue;
    }
    const urlStart = close + SEO_MARKDOWN.LINK_CLOSE_OPEN.length;
    const urlEnd = content.indexOf(")", urlStart);
    if (urlEnd < 0) {
      break;
    }
    const url = content.slice(urlStart, urlEnd).trim();
    if (isHttpOrPathUrl(url)) {
      onUrl(url);
    }
    i = urlEnd + 1;
  }
}

function readQuotedAttr(tag: string, attrName: string): string | null {
  const lower = tag.toLowerCase();
  const key = attrName.toLowerCase();
  let searchFrom = 0;
  while (searchFrom < lower.length) {
    const idx = lower.indexOf(key, searchFrom);
    if (idx < 0) {
      return null;
    }
    let i = idx + key.length;
    while (i < tag.length && (tag[i] === " " || tag[i] === "\t" || tag[i] === "\n" || tag[i] === "\r")) {
      i++;
    }
    if (tag[i] !== "=") {
      searchFrom = idx + 1;
      continue;
    }
    i++;
    while (i < tag.length && (tag[i] === " " || tag[i] === "\t" || tag[i] === "\n" || tag[i] === "\r")) {
      i++;
    }
    const quote = tag[i];
    if (quote !== '"' && quote !== "'") {
      return null;
    }
    i++;
    const end = tag.indexOf(quote, i);
    if (end < 0) {
      return null;
    }
    return tag.slice(i, end).trim();
  }
  return null;
}

/** Linear scan for `<a ... href="...">` tags. */
function forEachAnchorHref(content: string, onHref: (href: string) => void): void {
  const lower = content.toLowerCase();
  let searchFrom = 0;
  while (searchFrom < content.length) {
    const tagStart = lower.indexOf(SEO_MARKDOWN.ANCHOR_TAG, searchFrom);
    if (tagStart < 0) {
      break;
    }
    const afterA = tagStart + SEO_MARKDOWN.ANCHOR_TAG.length;
    const next = content[afterA];
    if (next && next !== " " && next !== "\t" && next !== "\n" && next !== "\r" && next !== ">") {
      searchFrom = afterA;
      continue;
    }
    const tagEnd = content.indexOf(">", afterA);
    if (tagEnd < 0) {
      break;
    }
    const href = readQuotedAttr(content.slice(tagStart, tagEnd), SEO_MARKDOWN.HREF_ATTR);
    if (href && isHttpOrPathUrl(href)) {
      onHref(href);
    }
    searchFrom = tagEnd + 1;
  }
}

function countInternalLinks(content: string): number {
  if (!content || typeof content !== "string") {
    return 0;
  }
  const html = content.trim();
  const origins = getInternalLinkOrigins();
  let count = 0;
  forEachMarkdownLinkUrl(html, (url) => {
    if (isInternalUrl(url, origins)) {
      count++;
    }
  });
  forEachAnchorHref(html, (href) => {
    if (isInternalUrl(href, origins)) {
      count++;
    }
  });
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

function countAtxHashes(line: string): number {
  let i = 0;
  while (i < line.length && line[i] === "#" && i < SEO_MARKDOWN.ATX_MAX_LEVEL) {
    i++;
  }
  return i;
}

function getAtxHeadingText(line: string, level?: number): string | null {
  const hashCount = countAtxHashes(line);
  if (hashCount < 1) {
    return null;
  }
  if (level != null && hashCount !== level) {
    return null;
  }
  if (hashCount < line.length && line[hashCount] === "#") {
    return null;
  }
  const afterHashes = line.slice(hashCount);
  if (!afterHashes.startsWith(" ") && !afterHashes.startsWith("\t")) {
    return null;
  }
  const text = afterHashes.trim();
  return text.length > 0 ? text : null;
}

function stripCodeFences(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf(SEO_MARKDOWN.FENCE, i);
    if (open < 0) {
      out += text.slice(i);
      break;
    }
    out += text.slice(i, open);
    const close = text.indexOf(SEO_MARKDOWN.FENCE, open + SEO_MARKDOWN.FENCE.length);
    if (close < 0) {
      break;
    }
    out += " ";
    i = close + SEO_MARKDOWN.FENCE.length;
  }
  return out;
}

function stripMarkdownImagesAndLinks(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const imageOpen = text.indexOf(SEO_MARKDOWN.IMAGE_OPEN, i);
    const linkOpen = text.indexOf("[", i);
    let open = -1;
    let isImage = false;
    if (imageOpen >= 0 && (linkOpen < 0 || imageOpen <= linkOpen)) {
      open = imageOpen;
      isImage = true;
    } else if (linkOpen >= 0) {
      open = linkOpen;
    }
    if (open < 0) {
      out += text.slice(i);
      break;
    }
    out += text.slice(i, open);
    const labelStart = isImage ? open + SEO_MARKDOWN.IMAGE_OPEN.length : open + 1;
    const close = text.indexOf("]", labelStart);
    if (close < 0) {
      out += text.slice(open);
      break;
    }
    if (!text.startsWith(SEO_MARKDOWN.LINK_CLOSE_OPEN, close)) {
      out += text.slice(open, close + 1);
      i = close + 1;
      continue;
    }
    const urlStart = close + SEO_MARKDOWN.LINK_CLOSE_OPEN.length;
    const urlEnd = text.indexOf(")", urlStart);
    if (urlEnd < 0) {
      out += text.slice(open);
      break;
    }
    out += " ";
    i = urlEnd + 1;
  }
  return out;
}

function collapseWhitespace(text: string): string {
  let out = "";
  let prevSpace = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const isSpace = ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f";
    if (isSpace) {
      if (!prevSpace) {
        out += " ";
        prevSpace = true;
      }
    } else {
      out += ch;
      prevSpace = false;
    }
  }
  return out.trim();
}

function extractFirstH2Block(content: string): string {
  const trimmed = content.trim();
  const lines = trimmed.split("\n");
  let firstH2 = -1;
  for (let i = 0; i < lines.length; i++) {
    if (getAtxHeadingText(lines[i]!, SEO_MARKDOWN.H2_LEVEL)) {
      firstH2 = i;
      break;
    }
  }
  if (firstH2 >= 0) {
    let end = lines.length;
    for (let i = firstH2 + 1; i < lines.length; i++) {
      if (getAtxHeadingText(lines[i]!, SEO_MARKDOWN.H2_LEVEL)) {
        end = i;
        break;
      }
    }
    return lines.slice(firstH2 + 1, end).join("\n").trim();
  }
  const intro = trimmed.slice(0, SEO_THRESHOLDS.DIRECT_ANSWER_INTRO_CHARS);
  const introLines = intro.split("\n");
  for (let i = 0; i < introLines.length; i++) {
    if (getAtxHeadingText(introLines[i]!, SEO_MARKDOWN.H2_LEVEL)) {
      return introLines.slice(0, i).join("\n").trim();
    }
  }
  return intro.slice(0, SEO_THRESHOLDS.DIRECT_ANSWER_BEFORE_H2_FALLBACK_CHARS).trim();
}

function hasDirectAnswerBlock(content: string): boolean {
  if (!content) {
    return false;
  }
  const block = extractFirstH2Block(content);
  const withoutFences = stripCodeFences(block);
  const withoutLinks = stripMarkdownImagesAndLinks(withoutFences);
  let cleaned = "";
  for (let i = 0; i < withoutLinks.length; i++) {
    const ch = withoutLinks[i]!;
    cleaned += "#>*_`-".includes(ch) ? " " : ch;
  }
  const prose = collapseWhitespace(cleaned);
  const words = prose.split(" ").filter(Boolean);
  if (words.length < SEO_THRESHOLDS.DIRECT_ANSWER_MIN_WORDS || words.length > SEO_THRESHOLDS.DIRECT_ANSWER_MAX_WORDS) {
    return false;
  }
  const sentences = prose
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > SEO_THRESHOLDS.DIRECT_ANSWER_MIN_SENTENCE_CHARS);
  return sentences.length >= SEO_THRESHOLDS.DIRECT_ANSWER_MIN_SENTENCES;
}

function getHeadingStats(content: string): { h2Count: number; hasDuplicateH2: boolean } {
  const lines = content.split("\n");
  const h2Texts: string[] = [];
  for (const line of lines) {
    const text = getAtxHeadingText(line, SEO_MARKDOWN.H2_LEVEL);
    if (text) {
      h2Texts.push(text.toLowerCase());
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
  let normalized = "";
  const lower = text.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i]!;
    const code = ch.charCodeAt(0);
    const isAlphaNum = (code >= 97 && code <= 122) || (code >= 48 && code <= 57);
    if (isAlphaNum || ch === "-") {
      normalized += ch;
    } else {
      normalized += " ";
    }
  }
  return collapseWhitespace(normalized)
    .split(" ")
    .filter((t) => t.length > 1);
}

function collectHeadingLines(content: string, maxLevel: number): string[] {
  const headings: string[] = [];
  for (const line of content.split("\n")) {
    const hashCount = countAtxHashes(line);
    if (hashCount >= 1 && hashCount <= maxLevel && getAtxHeadingText(line)) {
      headings.push(line);
    }
  }
  return headings;
}

function hasPhraseStuffing(title: string, content: string): boolean {
  const headings = collectHeadingLines(content, SEO_MARKDOWN.STUFFING_HEADING_MAX_LEVEL).join(" ");
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

function isWeakAlt(alt: string): boolean {
  return !alt || SEO_ALT_DENYLIST.includes(alt as (typeof SEO_ALT_DENYLIST)[number]);
}

function forEachMarkdownImageAlt(content: string, onAlt: (alt: string) => void): void {
  let i = 0;
  while (i < content.length) {
    const open = content.indexOf(SEO_MARKDOWN.IMAGE_OPEN, i);
    if (open < 0) {
      break;
    }
    const altStart = open + SEO_MARKDOWN.IMAGE_OPEN.length;
    const close = content.indexOf("]", altStart);
    if (close < 0) {
      break;
    }
    if (!content.startsWith(SEO_MARKDOWN.LINK_CLOSE_OPEN, close)) {
      i = altStart;
      continue;
    }
    const urlStart = close + SEO_MARKDOWN.LINK_CLOSE_OPEN.length;
    const urlEnd = content.indexOf(")", urlStart);
    if (urlEnd < 0) {
      break;
    }
    if (urlEnd > urlStart) {
      onAlt(content.slice(altStart, close));
    }
    i = urlEnd + 1;
  }
}

function forEachHtmlImageTag(content: string, onTag: (tag: string) => void): void {
  const lower = content.toLowerCase();
  let searchFrom = 0;
  while (searchFrom < content.length) {
    const tagStart = lower.indexOf(SEO_MARKDOWN.IMG_TAG, searchFrom);
    if (tagStart < 0) {
      break;
    }
    const afterImg = tagStart + SEO_MARKDOWN.IMG_TAG.length;
    const next = content[afterImg];
    if (next && next !== " " && next !== "\t" && next !== "\n" && next !== "\r" && next !== "/" && next !== ">") {
      searchFrom = afterImg;
      continue;
    }
    const tagEnd = content.indexOf(">", afterImg);
    if (tagEnd < 0) {
      break;
    }
    onTag(content.slice(tagStart, tagEnd + 1));
    searchFrom = tagEnd + 1;
  }
}

function analyzeImageAlts(content: string): { total: number; missingOrWeak: number } {
  if (!content) {
    return { total: 0, missingOrWeak: 0 };
  }
  let total = 0;
  let missingOrWeak = 0;
  forEachMarkdownImageAlt(content, (rawAlt) => {
    total++;
    if (isWeakAlt(rawAlt.trim().toLowerCase())) {
      missingOrWeak++;
    }
  });
  forEachHtmlImageTag(content, (tag) => {
    total++;
    const alt = (readQuotedAttr(tag, SEO_MARKDOWN.ALT_ATTR) || "").trim().toLowerCase();
    if (isWeakAlt(alt)) {
      missingOrWeak++;
    }
  });
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

export function getSeoScorecard(post: Partial<Post>, context: SeoScorecardContext = {}): SeoScorecard {
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

/** Serialize checks for persistence (dashboard tooltip parses these prefixes). */
export function formatSeoScoreSummary(checks: SeoCheck[]): string {
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

/** Parse persisted seo_score_summary back into checklist items for colored UI. */
export function parseSeoScoreSummary(summary: string): SeoCheck[] {
  const lines = summary
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line) => {
    if (line.startsWith(SEO_SUMMARY_PREFIX.OK)) {
      return { label: line.slice(SEO_SUMMARY_PREFIX.OK.length), ok: true };
    }
    if (line.startsWith(SEO_SUMMARY_PREFIX.WARN)) {
      return { label: line.slice(SEO_SUMMARY_PREFIX.WARN.length), ok: false, warning: true };
    }
    if (line.startsWith(SEO_SUMMARY_PREFIX.FAIL)) {
      return { label: line.slice(SEO_SUMMARY_PREFIX.FAIL.length), ok: false, warning: false };
    }
    return { label: line, ok: null };
  });
}

/** Soft pre-publish warnings for DEV.to and Google-oriented hygiene. */
export function getPublishSeoWarnings(post: Partial<Post>, context: SeoScorecardContext = {}): string[] {
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
export function getDevtoPublishWarnings(post: Partial<Post>): string[] {
  return getPublishSeoWarnings(post, { platforms: ["devto"] });
}
