/**
 * Content format helpers for the editor.
 * Source of truth is markdown (`content_markdown`); TipTap uses HTML only for display.
 */
import { marked } from "marked";
import TurndownService from "turndown";

marked.setOptions({ gfm: true, breaks: false });

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
});

turndown.addRule("fencedCodeBlock", {
  filter: (node) => node.nodeName === "PRE",
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const code =
      el.firstChild && (el.firstChild as HTMLElement).nodeName === "CODE" ? (el.firstChild as HTMLElement) : el;
    const className = code.getAttribute?.("class") || "";
    const lang = (className.match(/language-([^\s]+)/) || [])[1] || "";
    const text = code.textContent || "";
    return `\n\`\`\`${lang}\n${text.replace(/\n$/, "")}\n\`\`\`\n\n`;
  },
});

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

/** Convert TipTap/HTML editor output to markdown for storage and platform APIs. */
export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== "string") return "";
  const trimmed = html.trim();
  if (!trimmed) return "";
  return turndown
    .turndown(trimmed)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Normalize any editor payload (AI markdown or TipTap HTML) to markdown for `content_markdown`.
 */
export function toStorageMarkdown(content: string): string {
  if (!content || typeof content !== "string") return "";
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (isLikelyHtml(trimmed) && !isLikelyMarkdown(trimmed)) {
    return htmlToMarkdown(trimmed);
  }
  if (isLikelyHtml(trimmed) && isLikelyMarkdown(trimmed)) {
    // Prefer HTML→MD when TipTap block tags dominate (saved HTML posts).
    const blockHits = trimmed.match(HTML_BLOCK_ANY)?.length ?? 0;
    if (blockHits >= 2 || HTML_BLOCK_OPEN.test(trimmed)) {
      return htmlToMarkdown(trimmed);
    }
  }
  return normalizeMarkdownNewlines(trimmed);
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
