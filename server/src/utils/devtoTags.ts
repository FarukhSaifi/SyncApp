import { AI_POST_LIMITS } from "../constants/ai";

/** DEV.to allows max 4 tags; normalize to lowercase single-token names (no hyphens or spaces). */
export function normalizeDevtoTags(tags: string[] | undefined, maxTags = AI_POST_LIMITS.TAG_COUNT): string[] {
  const seen = new Set<string>();

  return (tags || [])
    .map((tag) =>
      tag
        .trim()
        .toLowerCase()
        .replace(/^#/, "")
        .replace(/[\s-]+/g, ""),
    )
    .filter((tag) => {
      if (!tag || seen.has(tag)) return false;
      seen.add(tag);
      return true;
    })
    .slice(0, maxTags);
}
