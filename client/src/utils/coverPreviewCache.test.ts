import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { COVER_UPLOAD } from "@constants/editor";

import { readCoverPreviewCache, writeCoverPreviewCache } from "./coverPreviewCache";

describe("coverPreviewCache", () => {
  const url = "https://cdn.test/cover.png";
  const dataUrl = "data:image/png;base64,abc";

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("writes and reads preview data for a URL", () => {
    expect(readCoverPreviewCache(url)).toBeNull();
    writeCoverPreviewCache(url, dataUrl);
    expect(readCoverPreviewCache(url)).toBe(dataUrl);
    expect(sessionStorage.getItem(`${COVER_UPLOAD["PREVIEW_SESSION_PREFIX"]}${url}`)).toBe(dataUrl);
  });

  it("ignores empty url or dataUrl", () => {
    writeCoverPreviewCache("", dataUrl);
    writeCoverPreviewCache(url, "");
    expect(readCoverPreviewCache(url)).toBeNull();
  });

  it("no-ops on SSR when window is undefined", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    try {
      writeCoverPreviewCache(url, dataUrl);
      expect(readCoverPreviewCache(url)).toBeNull();
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
