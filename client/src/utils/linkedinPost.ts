/**
 * LinkedIn teaser helpers — rewrite Read more URL when post canonical is known.
 */

import { CANONICAL_BASE_URL } from "@constants/api";

const READ_MORE_PREFIX = "Read more:";

/** Trailing lines that are only hashtags (e.g. "#WebDev #JavaScript"). */
const HASHTAG_LINE = /^(?:\s*#[\w-]+\s*)+$/;

/** Last path segment of a URL or path (post slug). */
export function extractSlugFromUrlOrPath(value: string): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  try {
    if (/^https?:\/\//i.test(raw)) {
      const path = new URL(raw).pathname.replace(/^\/+|\/+$/g, "");
      const parts = path.split("/").filter(Boolean);
      return parts[parts.length - 1] || "";
    }
  } catch {
    /* treat as path */
  }
  const parts = raw
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);
  return parts[parts.length - 1] || "";
}

/**
 * Prefer the public blog base (`NEXT_PUBLIC_CANONICAL_BASE_URL`) + slug so LinkedIn
 * never links to the SyncApp editor host.
 */
export function resolveLinkedInReadMoreUrl(canonicalUrl?: string | null, slugHint?: string | null): string | undefined {
  const base = (CANONICAL_BASE_URL || "").trim().replace(/\/$/, "");
  const existing = (canonicalUrl || "").trim();
  const slug = (slugHint || "").trim() || extractSlugFromUrlOrPath(existing);

  if (base && slug) {
    return `${base}/${slug}`;
  }

  if (existing.startsWith("http")) {
    return existing;
  }

  return undefined;
}

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

/** Replace or insert the Read more line (before hashtags) with the preferred public article URL. */
export function applyLinkedInReadMoreUrl(linkedinPost: string, preferredUrl?: string | null): string {
  const text = (linkedinPost || "").trim();
  if (!text) return "";

  const without = text.replace(new RegExp(`\\n*${READ_MORE_PREFIX}\\s*\\S+`, "gi"), "").trim();
  const url = (preferredUrl || "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return without;
  }

  return insertReadMoreBeforeHashtags(without, `${READ_MORE_PREFIX} ${url}`);
}

export function extractLinkedInReadMoreUrl(linkedinPost: string): string | null {
  const match = linkedinPost.match(new RegExp(`${READ_MORE_PREFIX}\\s*(\\S+)`, "i"));
  return match?.[1] || null;
}
