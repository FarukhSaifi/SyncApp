import { HTTP } from "@constants";
import { describe, expect, it } from "vitest";

import { parseWordpressUsernamePasswordBlob, wordpressBasicAuthHeaders } from "./wordpressAuth";

describe("wordpressAuth", () => {
  it("builds Basic Authorization header (not Bearer) and strips password spaces", () => {
    const headers = wordpressBasicAuthHeaders("alice", "app pass 123");
    const auth = headers[HTTP.HEADERS.AUTHORIZATION];
    expect(auth.startsWith(`${HTTP.AUTH_SCHEMES.BASIC} `)).toBe(true);
    expect(auth.includes(HTTP.AUTH_SCHEMES.BEARER)).toBe(false);
    expect(headers[HTTP.HEADERS.CONTENT_TYPE]).toBe(HTTP.CONTENT_TYPES.JSON);

    const decoded = Buffer.from(auth.replace(new RegExp(`^${HTTP.AUTH_SCHEMES.BASIC}\\s+`), ""), "base64").toString(
      "utf8",
    );
    expect(decoded).toBe("alice:apppass123");
  });

  it("parses username:password blobs", () => {
    expect(parseWordpressUsernamePasswordBlob("user:secret-token")).toEqual({
      username: "user",
      password: "secret-token",
    });
    expect(parseWordpressUsernamePasswordBlob("user:pass:with:colons")).toEqual({
      username: "user",
      password: "pass:with:colons",
    });
    expect(parseWordpressUsernamePasswordBlob("nosplit")).toBeNull();
    expect(parseWordpressUsernamePasswordBlob(":nopass")).toBeNull();
    expect(parseWordpressUsernamePasswordBlob("nouser:")).toBeNull();
    expect(parseWordpressUsernamePasswordBlob("")).toBeNull();
  });
});
