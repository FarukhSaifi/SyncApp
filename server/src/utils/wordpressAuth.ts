import { HTTP } from "@constants";

/**
 * Build HTTP Basic Authorization header for WordPress Application Passwords.
 * Never log the returned value.
 */
export function wordpressBasicAuthHeaders(username: string, appPassword: string): Record<string, string> {
  const user = (username || "").trim();
  const pass = (appPassword || "").trim().replace(/\s+/g, "");
  const token = Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
  return {
    [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BASIC} ${token}`,
    [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
  };
}

/**
 * Parse legacy "username:application_password" blobs from a single api_key field.
 * Returns null when the value is not a username:password pair.
 */
export function parseWordpressUsernamePasswordBlob(raw: string): { username: string; password: string } | null {
  const value = (raw || "").trim();
  const idx = value.indexOf(":");
  if (idx <= 0 || idx === value.length - 1) {
    return null;
  }
  const username = value.slice(0, idx).trim();
  const password = value.slice(idx + 1).trim();
  if (!username || !password) {
    return null;
  }
  return { username, password };
}
