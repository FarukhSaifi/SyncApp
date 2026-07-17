/**
 * LinkedIn teaser helpers — rewrite Read more URL when post canonical is known.
 */

const READ_MORE_PREFIX = "Read more:";

/** Replace or append the Read more line with the preferred public article URL. */
export function applyLinkedInReadMoreUrl(linkedinPost: string, preferredUrl?: string | null): string {
  const text = (linkedinPost || "").trim();
  if (!text) return "";

  const url = (preferredUrl || "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return text.replace(new RegExp(`\\n*${READ_MORE_PREFIX}\\s*\\S+`, "gi"), "").trim();
  }

  const without = text.replace(new RegExp(`\\n*${READ_MORE_PREFIX}\\s*\\S+`, "gi"), "").trim();
  return `${without}\n\n${READ_MORE_PREFIX} ${url}`;
}

export function extractLinkedInReadMoreUrl(linkedinPost: string): string | null {
  const match = linkedinPost.match(new RegExp(`${READ_MORE_PREFIX}\\s*(\\S+)`, "i"));
  return match?.[1] || null;
}
