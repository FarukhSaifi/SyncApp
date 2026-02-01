/**
 * Content format helpers for the editor.
 * AI returns markdown; Quill uses HTML. We detect format and convert for display.
 */
import { marked } from "marked";

/** Heuristic: content looks like HTML (tags, not raw markdown) */
export function isLikelyHtml(content) {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  return trimmed.startsWith("<") || /<[a-z][\s\S]*>/i.test(trimmed);
}

/** Heuristic: content looks like markdown (headings, lists, bold, etc.) */
export function isLikelyMarkdown(content) {
  if (!content || typeof content !== "string") return false;
  if (isLikelyHtml(content)) return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  return (
    /^#{1,6}\s/m.test(trimmed) ||
    /^\s*[-*+]\s/m.test(trimmed) ||
    /^\s*\d+\.\s/m.test(trimmed) ||
    /\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_/.test(trimmed) ||
    /\[.+\]\(.+\)/.test(trimmed) ||
    /^```/m.test(trimmed) ||
    /^>\s/m.test(trimmed)
  );
}

/** Convert markdown to HTML for Quill. Safe for empty input. */
export function markdownToHtml(markdown) {
  if (!markdown || typeof markdown !== "string") return "";
  const html = marked.parse(markdown.trim(), { async: false });
  return typeof html === "string" ? html : String(html ?? "");
}

/**
 * Content suitable for pasting into Quill (HTML).
 * If input is markdown, convert to HTML; otherwise return as-is (assume HTML).
 */
export function contentForQuill(content) {
  if (!content || typeof content !== "string") return "";
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (isLikelyMarkdown(trimmed)) return markdownToHtml(trimmed);
  return trimmed;
}
