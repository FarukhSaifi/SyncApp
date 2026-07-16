/**
 * Content format helpers for the editor.
 * AI returns markdown; TipTap uses HTML. We detect format and convert for display.
 */
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/** Real HTML open tags TipTap/saved posts use — not TypeScript generics like Promise<T>. */
const HTML_BLOCK_OPEN =
  /^<(?:p|div|h[1-6]|ul|ol|li|blockquote|pre|article|section|table|thead|tbody|tr|td|th|figure|img|hr|br)\b/i;

const HTML_BLOCK_ANY = /<\/?(?:p|div|h[1-6]|ul|ol|li|blockquote|pre|article|section|table)\b/gi;

/** Heuristic: content looks like HTML (TipTap output), not markdown with code generics. */
export function isLikelyHtml(content: string): boolean {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  if (HTML_BLOCK_OPEN.test(trimmed)) return true;
  const blockHits = trimmed.match(HTML_BLOCK_ANY)?.length ?? 0;
  return blockHits >= 2;
}

/** True when markdown syntax is present (headings, fences, lists, etc.). */
export function hasMarkdownSyntax(content: string): boolean {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  return (
    /^#{1,6}\s/m.test(trimmed) ||
    /^\s*[-*+]\s/m.test(trimmed) ||
    /^\s*\d+\.\s/m.test(trimmed) ||
    /\*\*[^*]+\*\*/.test(trimmed) ||
    /\[.+\]\(.+\)/.test(trimmed) ||
    /^```/m.test(trimmed) ||
    /```[\s\S]*?```/.test(trimmed) ||
    /^>\s/m.test(trimmed)
  );
}

/** Heuristic: content looks like markdown and should be converted for TipTap. */
export function isLikelyMarkdown(content: string): boolean {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  // Strong markdown signals win even if the body contains `Foo<Bar>` in code.
  if (hasMarkdownSyntax(trimmed)) {
    if (!isLikelyHtml(trimmed)) return true;
    // Mixed: prefer markdown when it has ATX-style headings or fences.
    return /^#{1,6}\s/m.test(trimmed) || /^```/m.test(trimmed) || /```[\s\S]*?```/.test(trimmed);
  }
  return false;
}

/**
 * Repair literal `\n` sequences when the model/JSON path collapsed real newlines.
 */
export function normalizeMarkdownNewlines(markdown: string): string {
  if (!markdown || typeof markdown !== "string") return "";
  let text = markdown.replace(/\r\n/g, "\n");
  // Only expand escapes when the string has almost no real line breaks.
  const realBreaks = (text.match(/\n/g) || []).length;
  if (realBreaks < 2 && /\\n/.test(text)) {
    text = text.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  }
  return text;
}

/** Convert markdown to HTML for TipTap. Safe for empty input. */
export function markdownToHtml(markdown: string): string {
  if (!markdown || typeof markdown !== "string") return "";
  const normalized = normalizeMarkdownNewlines(markdown).trim();
  if (!normalized) return "";
  const html = marked.parse(normalized, { async: false });
  return typeof html === "string" ? html : String(html ?? "");
}

/**
 * Normalize any editor payload (AI markdown or existing HTML) to TipTap HTML.
 */
export function toEditorHtml(content: string): string {
  if (!content || typeof content !== "string") return "";
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (isLikelyMarkdown(trimmed)) return markdownToHtml(trimmed);
  if (isLikelyHtml(trimmed)) return trimmed;
  // Plain prose / ambiguous — still try markdown so soft breaks render.
  if (hasMarkdownSyntax(trimmed) || /\n\n/.test(trimmed)) return markdownToHtml(trimmed);
  return trimmed;
}
