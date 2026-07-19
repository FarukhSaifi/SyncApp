/**
 * Build public article "Read more" URLs for LinkedIn teasers.
 */
import createSlug from "slugify";
import { config } from "../config";
import { AI_POST_LIMITS } from "../constants";

export function slugifyArticlePath(value: string): string {
  return createSlug(value.trim(), { lower: true, strict: true }) || "post";
}

/**
 * Prefer AI slug (canonical_url field is a slug hint), else title.
 * Returns undefined when CANONICAL_BASE_URL (public blog, e.g. farukh.me) is not configured.
 * Never uses SITE_URL — that is the SyncApp client for auth/publishing UI.
 */
export function buildReadMoreUrl(title: string, aiSlugHint?: string): string | undefined {
  const base = (config.canonicalBaseUrl || "").trim().replace(/\/$/, "");
  if (!base) return undefined;

  const rawHint = (aiSlugHint || "").trim().replace(/^\/+|\/+$/g, "");
  const slug =
    rawHint && !/^https?:\/\//i.test(rawHint) && !rawHint.includes(".")
      ? slugifyArticlePath(rawHint)
      : slugifyArticlePath(title);

  return `${base}/${slug}`;
}

/** Trailing lines that are only hashtags (e.g. "#WebDev #JavaScript"). */
const HASHTAG_LINE = /^(?:\s*#[\w-]+\s*)+$/;

/**
 * Insert Read more before trailing hashtag lines so the order is:
 * body → Read more → hashtags.
 */
export function insertReadMoreBeforeHashtags(body: string, readMoreLine: string): string {
  const lines = body.split("\n");
  let hashtagStart = lines.length;

  while (hashtagStart > 0) {
    const line = lines[hashtagStart - 1].trim();
    if (!line) {
      hashtagStart -= 1;
      continue;
    }
    if (HASHTAG_LINE.test(line)) {
      hashtagStart -= 1;
      continue;
    }
    break;
  }

  const before = lines.slice(0, hashtagStart).join("\n").trimEnd();
  const hashtags = lines
    .slice(hashtagStart)
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");

  if (hashtags) {
    return `${before}\n\n${readMoreLine}\n\n${hashtags}`.trim();
  }
  return `${before}\n\n${readMoreLine}`.trim();
}

/** Strip model-invented Read more lines, then insert the real URL before hashtags. */
export function finalizeLinkedInPost(linkedinPost: string, readMoreUrl?: string): string {
  const prefix = AI_POST_LIMITS.LINKEDIN_READ_MORE_PREFIX;
  let text = linkedinPost
    .replace(new RegExp(`\\n*${prefix}\\s*\\S+`, "gi"), "")
    .replace(/\n*Read\s+the\s+full\s+article:\s*\S+/gi, "")
    .trim();

  if (readMoreUrl) {
    text = insertReadMoreBeforeHashtags(text, `${prefix} ${readMoreUrl}`);
  }

  return text;
}
