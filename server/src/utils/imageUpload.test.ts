import { DEFAULT_VALUES } from "@constants";
import { describe, expect, it } from "vitest";

import { assertAllowedUploadImageMime, assertStandaloneImageSize, extensionForUploadImageMime } from "./imageUpload";

describe("imageUpload", () => {
  it("accepts allowed mimes and maps extension", () => {
    const mime = (DEFAULT_VALUES["ALLOWED_UPLOAD_IMAGE_MIMES"] as readonly string[])[0];
    expect(assertAllowedUploadImageMime(mime)).toBe(mime);
    expect(extensionForUploadImageMime(mime).length).toBeGreaterThan(0);
  });

  it("rejects unknown mime", () => {
    expect(() => assertAllowedUploadImageMime("application/pdf")).toThrow();
  });

  it("rejects oversized standalone images", () => {
    const tooBig = DEFAULT_VALUES["MAX_STANDALONE_IMAGE_BYTES"] + 1;
    expect(() => assertStandaloneImageSize(tooBig)).toThrow();
  });
});
