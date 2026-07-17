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
 * Returns undefined when CANONICAL_BASE_URL / SITE_URL is not configured.
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

/** Strip model-invented Read more lines, then append the real URL when available. */
export function finalizeLinkedInPost(linkedinPost: string, readMoreUrl?: string): string {
  const prefix = AI_POST_LIMITS.LINKEDIN_READ_MORE_PREFIX;
  let text = linkedinPost
    .replace(new RegExp(`\\n*${prefix}\\s*\\S+`, "gi"), "")
    .replace(/\n*Read\s+the\s+full\s+article:\s*\S+/gi, "")
    .trim();

  if (readMoreUrl) {
    text = `${text}\n\n${prefix} ${readMoreUrl}`;
  }

  return text;
}
