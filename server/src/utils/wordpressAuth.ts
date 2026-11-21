import { HTTP } from "@constants";

/**
 * Build HTTP Basic Authorization header for WordPress Application Passwords.
 * Never log the returned value.
 */
function stripAsciiWhitespace(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]!;
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f" || ch === "\v") {
      continue;
    }
    out += ch;
  }
  return out;
}

export function wordpressBasicAuthHeaders(account: string, appSecret: string): Record<string, string> {
  const user = (account || "").trim();
  const secret = stripAsciiWhitespace((appSecret || "").trim());
  const token = Buffer.from([user, secret].join(":"), "utf8").toString("base64");
  return {
    [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BASIC} ${token}`,
    [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
  };
}

export type WordpressAuthBlob = {
  account: string;
  secret: string;
};

/**
 * Parse legacy "account:application_password" blobs from a single api_key field.
 * Returns null when the value is not an account/secret pair.
 */
export function parseWordpressAuthBlob(raw: string): WordpressAuthBlob | null {
  const value = (raw || "").trim();
  const idx = value.indexOf(":");
  if (idx <= 0 || idx === value.length - 1) {
    return null;
  }
  const account = value.slice(0, idx).trim();
  const secret = value.slice(idx + 1).trim();
  if (!account || !secret) {
    return null;
  }
  return { account, secret };
}
