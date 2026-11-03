import { describe, expect, it } from "vitest";

import { scrubWordpressErrorMessage } from "./wordpressErrors";

describe("wordpressErrors", () => {
  it("redacts Basic and Bearer tokens", () => {
    const scrubbed = scrubWordpressErrorMessage(
      new Error("Request failed Authorization: Bearer abc.def with Basic YWxpY2U6c2VjcmV0"),
    );
    expect(scrubbed).not.toContain("abc.def");
    expect(scrubbed).not.toContain("YWxpY2U6c2VjcmV0");
    expect(scrubbed).toMatch(/REDACTED/i);
  });

  it("redacts Authorization and application_password fields", () => {
    const scrubbed = scrubWordpressErrorMessage(
      'application_password: "xxxx-yyyy-zzzz" Authorization="secret-token"',
    );
    expect(scrubbed).not.toContain("xxxx-yyyy-zzzz");
    expect(scrubbed).not.toContain("secret-token");
    expect(scrubbed).toMatch(/REDACTED/i);
  });

  it("handles non-Error values and caps length", () => {
    const long = `fail ${"a".repeat(600)}`;
    const scrubbed = scrubWordpressErrorMessage(long);
    expect(scrubbed.length).toBeLessThanOrEqual(500);
    expect(scrubWordpressErrorMessage(null)).toMatch(/Unknown WordPress error/i);
  });
});
