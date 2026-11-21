/**
 * Scrub secrets and auth material from WordPress/axios error messages before logging or client return.
 */
export function scrubWordpressErrorMessage(raw: unknown): string {
  let message = raw instanceof Error ? raw.message : String(raw ?? "Unknown WordPress error");
  message = message.replace(/Basic\s+[A-Za-z0-9+/=]+/gi, "Basic [REDACTED]");
  message = message.replace(/Bearer\s+[A-Za-z0-9._\\-]+/gi, "Bearer [REDACTED]");
  message = message.replace(/Authorization["']?\s*[:=]\s*["']?[^"',\s]+/gi, "Authorization:[REDACTED]");
  message = message.replace(
    /application[_-]?password["']?\s*[:=]\s*["']?[^"',\s]+/gi,
    "application_password:[REDACTED]",
  );
  // Strip obvious base64 user:pass blobs in query-ish fragments
  message = message.replace(/[A-Za-z0-9+/]{20,}={0,2}/g, (match) => {
    if (match.length > 40) {
      return "[REDACTED]";
    }
    return match;
  });
  return message.slice(0, 500);
}
