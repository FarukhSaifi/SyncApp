/**
 * Content-format heuristics for editor markdown ↔ HTML conversion.
 */

/** Real HTML open tags TipTap/saved posts use — not TypeScript generics like Promise&lt;T&gt;. */
export const HTML_BLOCK_OPEN =
  /^<(?:p|div|h[1-6]|ul|ol|li|blockquote|pre|article|section|table|thead|tbody|tr|td|th|figure|img|hr|br)\b/i;

/** Any HTML block tag (open or close) used for density heuristics. */
export const HTML_BLOCK_ANY = /<\/?(?:p|div|h[1-6]|ul|ol|li|blockquote|pre|article|section|table)\b/gi;

/** Minimum distinct block-tag hits before treating mixed content as HTML. */
export const HTML_BLOCK_HIT_MIN = 2;
