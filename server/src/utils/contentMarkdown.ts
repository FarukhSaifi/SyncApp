/**
 * Normalize post body to markdown for storage (HTML TipTap output → markdown).
 */
import TurndownService from "turndown";

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
    const first = node.firstChild as {
      nodeName?: string;
      getAttribute?: (name: string) => string | null;
      textContent?: string | null;
    } | null;
    const code =
      first && first.nodeName === "CODE"
        ? first
        : (node as { getAttribute?: (name: string) => string | null; textContent?: string | null });
    const className = (typeof code.getAttribute === "function" ? code.getAttribute("class") : "") || "";
    const lang = (className.match(/language-([^\s]+)/) || [])[1] || "";
    const text = code.textContent || "";
    return `\n\`\`\`${lang}\n${text.replace(/\n$/, "")}\n\`\`\`\n\n`;
  },
});

const HTML_BLOCK_OPEN =
  /^<(?:p|div|h[1-6]|ul|ol|li|blockquote|pre|article|section|table|thead|tbody|tr|td|th|figure|img|hr|br)\b/i;
const HTML_BLOCK_ANY = /<\/?(?:p|div|h[1-6]|ul|ol|li|blockquote|pre|article|section|table)\b/gi;

function isLikelyHtml(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  if (HTML_BLOCK_OPEN.test(trimmed)) return true;
  return (trimmed.match(HTML_BLOCK_ANY)?.length ?? 0) >= 2;
}

/** Ensure `content_markdown` is markdown, not TipTap HTML. */
export function ensureMarkdownContent(content: string | undefined | null): string {
  if (!content || typeof content !== "string") return "";
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (!isLikelyHtml(trimmed)) return trimmed;
  return turndown
    .turndown(trimmed)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
