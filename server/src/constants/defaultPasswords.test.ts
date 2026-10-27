import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_PASSWORDS, resolveTempPassword } from "./defaultPasswords";

describe("resolveTempPassword", () => {
  const envKey = DEFAULT_PASSWORDS.ENV_TEMP_PASSWORD;

  afterEach(() => {
    delete process.env[envKey];
  });

  it("returns trimmed password from env", () => {
    process.env[envKey] = "  temp-secret-123  ";
    expect(resolveTempPassword()).toBe("temp-secret-123");
  });

  it("throws when env password is missing", () => {
    expect(() => resolveTempPassword()).toThrow(/Missing DEFAULT_TEMP_PASSWORD/);
  });
});
