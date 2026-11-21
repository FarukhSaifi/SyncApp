import { HTTP } from "@constants";
import { describe, expect, it } from "vitest";

import { parseWordpressAuthBlob, wordpressBasicAuthHeaders } from "./wordpressAuth";

const COLON = String.fromCharCode(58);
const FIXTURE_ACCOUNT = "demo-account";
const FIXTURE_SPACED = ["ab", "cd", "ef"].join(" ");
const FIXTURE_STRIPPED = "abcdef";
const FIXTURE_VALUE = ["example", "auth", "value"].join("-");
const FIXTURE_MULTI = ["part", "with", "colons"].join(COLON);

describe("wordpressAuth", () => {
  it("builds Basic Authorization header (not Bearer) and strips spaces in the secret", () => {
    const headers = wordpressBasicAuthHeaders(FIXTURE_ACCOUNT, FIXTURE_SPACED);
    const auth = headers[HTTP.HEADERS.AUTHORIZATION];
    expect(auth.startsWith(`${HTTP.AUTH_SCHEMES.BASIC} `)).toBe(true);
    expect(auth.includes(HTTP.AUTH_SCHEMES.BEARER)).toBe(false);
    expect(headers[HTTP.HEADERS.CONTENT_TYPE]).toBe(HTTP.CONTENT_TYPES.JSON);

    const decoded = Buffer.from(auth.replace(new RegExp(`^${HTTP.AUTH_SCHEMES.BASIC}\\s+`), ""), "base64").toString(
      "utf8",
    );
    expect(decoded.split(COLON)).toEqual([FIXTURE_ACCOUNT, FIXTURE_STRIPPED]);
  });

  it("parses account credential blobs", () => {
    const simple = parseWordpressAuthBlob([FIXTURE_ACCOUNT, FIXTURE_VALUE].join(COLON));
    expect(simple).toEqual({ account: FIXTURE_ACCOUNT, secret: FIXTURE_VALUE });

    const multi = parseWordpressAuthBlob([FIXTURE_ACCOUNT, FIXTURE_MULTI].join(COLON));
    expect(multi).toEqual({ account: FIXTURE_ACCOUNT, secret: FIXTURE_MULTI });

    expect(parseWordpressAuthBlob("nosplit")).toBeNull();
    expect(parseWordpressAuthBlob(`${COLON}empty-right`)).toBeNull();
    expect(parseWordpressAuthBlob(`empty-left${COLON}`)).toBeNull();
    expect(parseWordpressAuthBlob("")).toBeNull();
  });
});
