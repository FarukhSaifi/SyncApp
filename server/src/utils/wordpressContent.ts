import { REGEX_PATTERNS } from "@constants";

function isHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) {
    return false;
  }
  return trimmed.startsWith("<") && REGEX_PATTERNS.HTML_CONTENT_DETECT.test(trimmed);
}

/**
 * Escape HTML text nodes for markdown→HTML conversion.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Minimal markdown→HTML for WP REST `content` when the editor stores markdown.
 * If content is already HTML (TipTap/Quill), return as-is.
 */
export function resolveWordpressHtmlContent(contentMarkdown: string): string {
  const content = contentMarkdown || "";
  if (!content.trim()) {
    return "";
  }
  if (isHtmlContent(content)) {
    return content;
  }

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const htmlParts: string[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }
    const joined = paragraph.join(" ").trim();
    if (joined) {
      htmlParts.push(`<p>${inlineMarkdown(joined)}</p>`);
    }
    paragraph = [];
  };

  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      htmlParts.push(`<h${level}>${inlineMarkdown(heading[2].trim())}</h${level}>`);
      continue;
    }
    if (line.trim() === "") {
      flushParagraph();
      continue;
    }
    paragraph.push(line.trim());
  }
  flushParagraph();
  return htmlParts.join("\n");
}

function inlineMarkdown(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" rel="noopener noreferrer">$1</a>',
  );
  return out;
}
