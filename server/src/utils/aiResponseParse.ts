import { AI_POST_LIMITS } from "../constants/ai";
import type { GeneratePostResult } from "../types";
import { normalizeDevtoTags } from "./devtoTags";
import { sanitizeJsonString } from "./sanitizeJson";

function normalizeTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return "";
  if (trimmed.length <= AI_POST_LIMITS.TITLE_MAX) return trimmed;
  const cut = trimmed.slice(0, AI_POST_LIMITS.TITLE_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > AI_POST_LIMITS.TITLE_MIN ? cut.slice(0, lastSpace) : cut).trim();
}

function normalizeMetaDescription(metaDescription: string): string {
  return metaDescription.trim().slice(0, AI_POST_LIMITS.META_DESC_MAX);
}

function toGeneratePostResult(parsed: Record<string, unknown>): GeneratePostResult {
  return {
    title: normalizeTitle((parsed.title as string) || ""),
    meta_description: normalizeMetaDescription((parsed.meta_description as string) || ""),
    tags: normalizeDevtoTags(Array.isArray(parsed.tags) ? (parsed.tags as string[]) : []),
    content: (parsed.content_markdown as string) || (parsed.content as string) || "",
    canonical_url: typeof parsed.canonical_url === "string" ? parsed.canonical_url.trim() : "",
  };
}

/** Parses model JSON (including fenced or slightly malformed output) into post fields. */
export function parseJSONContent(rawText: string): GeneratePostResult {
  const stripped = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const attempts = [stripped, sanitizeJsonString(stripped)];
  for (const candidate of attempts) {
    try {
      return toGeneratePostResult(JSON.parse(candidate));
    } catch {
      // try next
    }
  }

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return toGeneratePostResult(JSON.parse(sanitizeJsonString(jsonMatch[0])));
    } catch {
      // fall through
    }
  }

  return { title: "", meta_description: "", tags: [], content: rawText.trim(), canonical_url: "" };
}

export function assertValidPostResult(result: GeneratePostResult, fallbackError: string): GeneratePostResult {
  const content = (result.content || "").trim();
  if (!content) {
    throw new Error(
      `${fallbackError}: model returned empty content. Check GOOGLE_AI_MODEL and GOOGLE_CLOUD_LOCATION (use global for gemini-3.5-flash).`,
    );
  }
  return result;
}
