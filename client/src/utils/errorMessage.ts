/**
 * Normalize API / auth errors into user-visible strings.
 * Prevents "[object Object]" when backends return nested error payloads (e.g. Vercel 500 JSON).
 */

function messageFromRecord(value: Record<string, unknown>): string | null {
  const candidates = [value.message, value.error, value.detail, value.details, value.description, value.msg];
  for (const candidate of candidates) {
    const resolved = coerceErrorMessage(candidate);
    if (resolved) return resolved;
  }
  return null;
}

export function coerceErrorMessage(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Error) {
    return value.message.trim() || fallback;
  }
  if (Array.isArray(value)) {
    const parts = value.map((item) => coerceErrorMessage(item, "")).filter(Boolean);
    return parts.length > 0 ? parts.join(". ") : fallback;
  }
  if (typeof value === "object") {
    const fromRecord = messageFromRecord(value as Record<string, unknown>);
    if (fromRecord) return fromRecord;
    try {
      const json = JSON.stringify(value);
      if (json && json !== "{}") return json;
    } catch {
      // ignore circular refs
    }
    return fallback;
  }
  return fallback;
}

/** Extract a message from axios-style API error response bodies. */
export function extractApiErrorMessage(data: unknown, status?: number, statusText?: string): string {
  const fromBody = coerceErrorMessage(data, "");
  if (fromBody) return fromBody;

  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    const nestedError = record.error;
    if (nestedError && typeof nestedError === "object") {
      const nested = coerceErrorMessage(nestedError, "");
      if (nested) return nested;
    }
  }

  if (status) {
    return statusText ? `HTTP ${status}: ${statusText}` : `HTTP ${status}`;
  }

  return "Request failed";
}
