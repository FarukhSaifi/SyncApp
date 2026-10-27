import { PLACEHOLDERS, SYNC_LABEL } from "@constants";
import { describe, expect, it } from "vitest";

import { formatDateTime, formatLastLogin } from "./dateUtils";

describe("dateUtils", () => {
  it("formatDateTime returns placeholder for empty/invalid", () => {
    expect(formatDateTime(null)).toBe(PLACEHOLDERS.N_A);
    expect(formatDateTime("not-a-date")).toBe(PLACEHOLDERS.N_A);
  });

  it("formatDateTime formats a valid ISO string", () => {
    const out = formatDateTime("2024-06-15T12:00:00.000Z");
    expect(out).not.toBe(PLACEHOLDERS.N_A);
    expect(out.length).toBeGreaterThan(0);
  });

  it("formatLastLogin uses never-logged-in label when missing", () => {
    expect(formatLastLogin(undefined)).toBe(SYNC_LABEL.NEVER_LOGGED_IN);
    expect(formatLastLogin("bogus")).toBe(SYNC_LABEL.NEVER_LOGGED_IN);
  });

  it("formatLastLogin formats valid timestamps", () => {
    const out = formatLastLogin("2024-06-15T12:00:00.000Z");
    expect(out).not.toBe(SYNC_LABEL.NEVER_LOGGED_IN);
    expect(out.length).toBeGreaterThan(0);
  });
});
