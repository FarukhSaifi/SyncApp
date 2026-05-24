/**
 * sanitizeJson – Escapes literal control characters (newline, tab, CR, etc.)
 * that appear inside JSON string values.
 *
 * Gemini's grounded/preview model sometimes returns JSON with real newline
 * bytes (0x0a) inside string values instead of the escaped sequence \n,
 * causing JSON.parse to throw "Bad control character in string literal".
 *
 * Strategy: walk the string char-by-char, tracking whether we are inside
 * a JSON quoted string. Only escape control chars found inside those regions.
 * Structural whitespace between keys/values is left untouched.
 */

// Build replacement strings using charCode to avoid source-level escape issues
const BACKSLASH = String.fromCharCode(92);       // \
const ESCAPED_LF = BACKSLASH + "n";              // \n
const ESCAPED_CR = BACKSLASH + "r";              // \r
const ESCAPED_TAB = BACKSLASH + "t";             // \t

function escapeUnicode(code: number): string {
  return BACKSLASH + "u" + code.toString(16).padStart(4, "0");
}

export function sanitizeJsonString(raw: string): string {
  let inString = false;
  let escaped = false;
  const out: string[] = [];

  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charAt(i);
    const code = ch.charCodeAt(0);

    if (escaped) {
      // Previous char was a backslash inside a string — pass through as-is
      out.push(ch);
      escaped = false;
      continue;
    }

    if (inString) {
      if (ch === BACKSLASH) {
        escaped = true;
        out.push(ch);
      } else if (ch === '"') {
        inString = false;
        out.push(ch);
      } else if (code < 0x20) {
        // Control character inside a JSON string — escape it
        if (code === 0x0a) out.push(ESCAPED_LF);
        else if (code === 0x0d) out.push(ESCAPED_CR);
        else if (code === 0x09) out.push(ESCAPED_TAB);
        else out.push(escapeUnicode(code));
      } else {
        out.push(ch);
      }
    } else {
      if (ch === '"') {
        inString = true;
      }
      out.push(ch);
    }
  }

  return out.join("");
}
