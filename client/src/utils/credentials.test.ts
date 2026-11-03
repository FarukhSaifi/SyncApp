import { describe, expect, it } from "vitest";

import { isCredentialConnected } from "./credentials";

describe("isCredentialConnected", () => {
  it("returns false for missing credential", () => {
    expect(isCredentialConnected(null)).toBe(false);
    expect(isCredentialConnected(undefined)).toBe(false);
  });

  it("requires configured true and no decrypt failure", () => {
    expect(isCredentialConnected({ configured: false })).toBe(false);
    expect(isCredentialConnected({ configured: true, decrypt_failed: true })).toBe(false);
    expect(isCredentialConnected({ configured: true })).toBe(true);
  });
});
