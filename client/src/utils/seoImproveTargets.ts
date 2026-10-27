/**
 * Map failing/warning SEO scorecard checks → targeted AI fix snippets.
 * Never packs the full post body as one rewrite target.
 */
import type { SeoCheck, SeoImproveApplyMode, SeoImproveField, SeoImproveProposedFix, SeoImproveTarget } from "@types";

import { SEO_IMPROVE_APPLY, SEO_IMPROVE_FIELDS, SEO_IMPROVE_LIMITS, SEO_IMPROVE_TARGET_IDS } from "@constants/seo";

export interface SeoImprovePostSnapshot {
  title?: string;
  meta_description?: string;
  tags?: string[];
  canonical_url?: string;
  content_markdown?: string;
}

type TargetDraft = {
  id: string;
  field: SeoImproveField;
  issues: string[];
  currentValue: string;
  applyMode: SeoImproveApplyMode;
  surroundingContext?: string;
};

function clampChars(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return value.slice(0, max).trimEnd();
}

function extractIntro(content: string): string {
  const idx = content.search(/^##\s/m);
  const head = idx === -1 ? content : content.slice(0, idx);
  return clampChars(head.trim(), SEO_IMPROVE_LIMITS.INTRO_CHARS);
}

function extractFirstH2Block(content: string): string {
  const match = content.match(/^##\s+.+$/m);
  if (!match || match.index === undefined) {
    return "";
  }
  const afterHeading = content.slice(match.index + match[0].length);
  const nextH2 = afterHeading.search(/^##\s/m);
  const body = nextH2 === -1 ? afterHeading : afterHeading.slice(0, nextH2);
  // Cap so a single long H2 section never exceeds the API currentValue limit.
  return clampChars(`${match[0]}\n${body}`.trim(), SEO_IMPROVE_LIMITS.CURRENT_VALUE_MAX);
}

function extractHeadings(content: string): string {
  const lines = content.match(/^##\s+.+$/gm);
  return lines ? clampChars(lines.join("\n"), SEO_IMPROVE_LIMITS.CURRENT_VALUE_MAX) : "";
}

function extractImageMarkdown(content: string): string {
  const imgs = content.match(/!\[[^\]]*\]\([^)]+\)/g);
  return imgs ? clampChars(imgs.join("\n"), SEO_IMPROVE_LIMITS.CURRENT_VALUE_MAX) : "";
}

function classifyCheck(label: string): string | "skip_manual" | null {
  const l = label.toLowerCase();
  if (l.includes("cover") || l.includes("featured image")) {
    return "skip_manual";
  }
  if (l.includes("schema-ready") || l.includes("schema ready")) {
    return "skip_manual";
  }
  if (l.includes("open post")) {
    return null;
  }
  if (l.includes("title")) {
    return SEO_IMPROVE_TARGET_IDS.TITLE;
  }
  if (l.includes("meta description") || l === "no meta description") {
    return SEO_IMPROVE_TARGET_IDS.META_DESCRIPTION;
  }
  if (l.includes("tag")) {
    return SEO_IMPROVE_TARGET_IDS.TAGS;
  }
  if (l.includes("canonical")) {
    return SEO_IMPROVE_TARGET_IDS.CANONICAL_URL;
  }
  if (l.includes("direct answer")) {
    return SEO_IMPROVE_TARGET_IDS.DIRECT_ANSWER;
  }
  if (l.includes("heading")) {
    return SEO_IMPROVE_TARGET_IDS.HEADINGS;
  }
  if (l.includes("intro")) {
    return SEO_IMPROVE_TARGET_IDS.QUERY_INTRO;
  }
  if (l.includes("stuffing")) {
    return SEO_IMPROVE_TARGET_IDS.ANTI_STUFFING;
  }
  if (l.includes("alt text") || l.includes("images missing")) {
    return SEO_IMPROVE_TARGET_IDS.IMAGE_ALTS;
  }
  if (l.includes("internal link")) {
    return SEO_IMPROVE_TARGET_IDS.INTERNAL_LINKS;
  }
  if (l.includes("authority") || l.includes("repo/demo") || l.includes("code sample")) {
    return SEO_IMPROVE_TARGET_IDS.AUTHORITY;
  }
  if (l.includes("troubleshooting")) {
    return SEO_IMPROVE_TARGET_IDS.TROUBLESHOOTING;
  }
  if (l.includes("discussion")) {
    return SEO_IMPROVE_TARGET_IDS.DISCUSSION;
  }
  return null;
}

function upsert(
  map: Map<string, TargetDraft>,
  id: string,
  field: SeoImproveField,
  issue: string,
  currentValue: string,
  applyMode: SeoImproveApplyMode,
  surroundingContext?: string,
): void {
  const existing = map.get(id);
  if (existing) {
    if (!existing.issues.includes(issue)) {
      existing.issues.push(issue);
    }
    return;
  }
  map.set(id, {
    id,
    field,
    issues: [issue],
    currentValue,
    applyMode,
    ...(surroundingContext ? { surroundingContext } : {}),
  });
}

/**
 * Build AI improve targets from live scorecard checks + post snapshot.
 * Cover / schema / N/A checks are skipped (manual or not AI-fixable).
 */
export function buildSeoImproveTargets(post: SeoImprovePostSnapshot, checks: SeoCheck[]): SeoImproveTarget[] {
  const content = post.content_markdown || "";
  const title = (post.title || "").trim();
  const meta = (post.meta_description || "").trim();
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const canonical = (post.canonical_url || "").trim();
  const map = new Map<string, TargetDraft>();

  for (const check of checks) {
    if (check.ok !== false) {
      continue;
    }
    const kind = classifyCheck(check.label);
    if (!kind || kind === "skip_manual") {
      continue;
    }

    switch (kind) {
      case SEO_IMPROVE_TARGET_IDS.TITLE:
        upsert(map, kind, SEO_IMPROVE_FIELDS.TITLE, check.label, title, SEO_IMPROVE_APPLY.REPLACE);
        break;
      case SEO_IMPROVE_TARGET_IDS.META_DESCRIPTION:
        upsert(map, kind, SEO_IMPROVE_FIELDS.META_DESCRIPTION, check.label, meta, SEO_IMPROVE_APPLY.REPLACE);
        break;
      case SEO_IMPROVE_TARGET_IDS.TAGS:
        upsert(
          map,
          kind,
          SEO_IMPROVE_FIELDS.TAGS,
          check.label,
          tags.join(SEO_IMPROVE_LIMITS.TAGS_JOIN),
          SEO_IMPROVE_APPLY.REPLACE,
        );
        break;
      case SEO_IMPROVE_TARGET_IDS.CANONICAL_URL:
        upsert(
          map,
          kind,
          SEO_IMPROVE_FIELDS.CANONICAL_URL,
          check.label,
          canonical,
          SEO_IMPROVE_APPLY.REPLACE,
          title.slice(0, SEO_IMPROVE_LIMITS.SURROUNDING_CHARS),
        );
        break;
      case SEO_IMPROVE_TARGET_IDS.DIRECT_ANSWER: {
        const block = extractFirstH2Block(content);
        upsert(
          map,
          kind,
          SEO_IMPROVE_FIELDS.CONTENT,
          check.label,
          block,
          block ? SEO_IMPROVE_APPLY.REPLACE : SEO_IMPROVE_APPLY.APPEND,
          extractIntro(content).slice(0, SEO_IMPROVE_LIMITS.SURROUNDING_CHARS),
        );
        break;
      }
      case SEO_IMPROVE_TARGET_IDS.HEADINGS: {
        const headings = extractHeadings(content);
        upsert(
          map,
          kind,
          SEO_IMPROVE_FIELDS.CONTENT,
          check.label,
          headings,
          headings ? SEO_IMPROVE_APPLY.REPLACE : SEO_IMPROVE_APPLY.APPEND,
          extractIntro(content).slice(0, SEO_IMPROVE_LIMITS.SURROUNDING_CHARS),
        );
        break;
      }
      case SEO_IMPROVE_TARGET_IDS.QUERY_INTRO: {
        const intro = extractIntro(content);
        upsert(
          map,
          kind,
          SEO_IMPROVE_FIELDS.CONTENT,
          check.label,
          intro,
          intro ? SEO_IMPROVE_APPLY.REPLACE : SEO_IMPROVE_APPLY.APPEND,
        );
        break;
      }
      case SEO_IMPROVE_TARGET_IDS.ANTI_STUFFING: {
        const scan = content.trim().slice(0, SEO_IMPROVE_LIMITS.STUFFING_SCAN_CHARS);
        upsert(map, kind, SEO_IMPROVE_FIELDS.CONTENT, check.label, scan, SEO_IMPROVE_APPLY.REPLACE);
        break;
      }
      case SEO_IMPROVE_TARGET_IDS.IMAGE_ALTS: {
        const imgs = extractImageMarkdown(content);
        if (!imgs) {
          break;
        }
        upsert(map, kind, SEO_IMPROVE_FIELDS.CONTENT, check.label, imgs, SEO_IMPROVE_APPLY.REPLACE);
        break;
      }
      case SEO_IMPROVE_TARGET_IDS.INTERNAL_LINKS:
        upsert(
          map,
          kind,
          SEO_IMPROVE_FIELDS.CONTENT,
          check.label,
          "",
          SEO_IMPROVE_APPLY.APPEND,
          extractIntro(content).slice(0, SEO_IMPROVE_LIMITS.SURROUNDING_CHARS),
        );
        break;
      case SEO_IMPROVE_TARGET_IDS.AUTHORITY:
        upsert(
          map,
          kind,
          SEO_IMPROVE_FIELDS.CONTENT,
          check.label,
          "",
          SEO_IMPROVE_APPLY.APPEND,
          extractIntro(content).slice(0, SEO_IMPROVE_LIMITS.SURROUNDING_CHARS),
        );
        break;
      case SEO_IMPROVE_TARGET_IDS.TROUBLESHOOTING:
        upsert(map, kind, SEO_IMPROVE_FIELDS.CONTENT, check.label, "", SEO_IMPROVE_APPLY.APPEND);
        break;
      case SEO_IMPROVE_TARGET_IDS.DISCUSSION:
        upsert(map, kind, SEO_IMPROVE_FIELDS.CONTENT, check.label, "", SEO_IMPROVE_APPLY.APPEND);
        break;
      default:
        break;
    }
  }

  return Array.from(map.values())
    .slice(0, SEO_IMPROVE_LIMITS.MAX_TARGETS)
    .map((draft) => ({
      id: draft.id,
      field: draft.field,
      issue: clampChars(draft.issues.join("; "), SEO_IMPROVE_LIMITS.ISSUE_MAX),
      currentValue: clampChars(draft.currentValue, SEO_IMPROVE_LIMITS.CURRENT_VALUE_MAX),
      applyMode: draft.applyMode,
      ...(draft.surroundingContext
        ? {
            surroundingContext: clampChars(draft.surroundingContext, SEO_IMPROVE_LIMITS.SURROUNDING_CHARS),
          }
        : {}),
    }));
}

function parseTagsValue(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((t) => t.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, ""))
    .filter(Boolean);
}

export interface SeoImproveApplyInput {
  title: string;
  meta_description: string;
  tags: string[];
  canonical_url: string;
  content_markdown: string;
}

/** Apply only the selected proposed fixes; leave all other post fields untouched. */
export function applySeoImproveFixes(post: SeoImproveApplyInput, fixes: SeoImproveProposedFix[]): SeoImproveApplyInput {
  let next: SeoImproveApplyInput = {
    title: post.title,
    meta_description: post.meta_description,
    tags: [...post.tags],
    canonical_url: post.canonical_url,
    content_markdown: post.content_markdown,
  };

  for (const fix of fixes) {
    const value = fix.value.trim();
    if (!value) {
      continue;
    }
    if (fix.field === SEO_IMPROVE_FIELDS.TITLE) {
      next = { ...next, title: value };
      continue;
    }
    if (fix.field === SEO_IMPROVE_FIELDS.META_DESCRIPTION) {
      next = { ...next, meta_description: value };
      continue;
    }
    if (fix.field === SEO_IMPROVE_FIELDS.TAGS) {
      next = { ...next, tags: parseTagsValue(value) };
      continue;
    }
    if (fix.field === SEO_IMPROVE_FIELDS.CANONICAL_URL) {
      next = { ...next, canonical_url: value };
      continue;
    }
    if (fix.field === SEO_IMPROVE_FIELDS.CONTENT) {
      if (fix.applyMode === SEO_IMPROVE_APPLY.APPEND || !fix.currentValue.trim()) {
        const base = next.content_markdown.trimEnd();
        next = {
          ...next,
          content_markdown: base ? `${base}\n\n${value}` : value,
        };
        continue;
      }
      if (next.content_markdown.includes(fix.currentValue)) {
        next = {
          ...next,
          // replaceAll: identical duplicated snippets (e.g. repeated sections) all update
          content_markdown: next.content_markdown.replaceAll(fix.currentValue, value),
        };
      }
    }
  }

  return next;
}
