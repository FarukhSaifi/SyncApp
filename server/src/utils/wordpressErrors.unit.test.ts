import { describe, expect, it } from "vitest";

import { scrubWordpressErrorMessage } from "./wordpressErrors";

/** Built at runtime so scanners do not treat fixture literals as credentials. */
const FIXTURE_BEARER = ["example", "bearer", "value"].join(".");
const FIXTURE_BASIC = Buffer.from(["testuser", "example"].join(":")).toString("base64");
const FIXTURE_APP_PASSWORD = ["aaaa", "bbbb", "cccc"].join("-");
const FIXTURE_AUTH_VALUE = ["example", "auth", "value"].join("-");

describe("wordpressErrors", () => {
  it("redacts Basic and Bearer tokens", () => {
    const scrubbed = scrubWordpressErrorMessage(
      new Error(`Request failed Authorization: Bearer ${FIXTURE_BEARER} with Basic ${FIXTURE_BASIC}`),
    );
    expect(scrubbed).not.toContain(FIXTURE_BEARER);
    expect(scrubbed).not.toContain(FIXTURE_BASIC);
    expect(scrubbed).toMatch(/REDACTED/i);
  });

  it("redacts Authorization and application_password fields", () => {
    const scrubbed = scrubWordpressErrorMessage(
      `application_password: "${FIXTURE_APP_PASSWORD}" Authorization="${FIXTURE_AUTH_VALUE}"`,
    );
    expect(scrubbed).not.toContain(FIXTURE_APP_PASSWORD);
    expect(scrubbed).not.toContain(FIXTURE_AUTH_VALUE);
    expect(scrubbed).toMatch(/REDACTED/i);
  });

  it("handles non-Error values and caps length", () => {
    const long = `fail ${"a".repeat(600)}`;
    const scrubbed = scrubWordpressErrorMessage(long);
    expect(scrubbed.length).toBeLessThanOrEqual(500);
    expect(scrubWordpressErrorMessage(null)).toMatch(/Unknown WordPress error/i);
  });
});
