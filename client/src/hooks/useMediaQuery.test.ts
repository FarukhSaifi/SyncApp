import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMediaQuery } from "./useMediaQuery";

describe("useMediaQuery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("syncs matches from matchMedia and listens for changes", () => {
    const listeners: Array<() => void> = [];
    const media = {
      matches: false,
      addEventListener: (_event: string, handler: () => void) => {
        listeners.push(handler);
      },
      removeEventListener: (_event: string, handler: () => void) => {
        const idx = listeners.indexOf(handler);
        if (idx >= 0) {
          listeners.splice(idx, 1);
        }
      },
    };

    vi.spyOn(window, "matchMedia").mockImplementation(() => media as MediaQueryList);

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    act(() => {
      media.matches = true;
      listeners.forEach((fn) => {
        fn();
      });
    });
    expect(result.current).toBe(true);
  });

  it("stays false when matchMedia is unavailable", () => {
    const originalMatchMedia = window.matchMedia;
    // @ts-expect-error simulate missing API
    window.matchMedia = undefined;
    try {
      const { result } = renderHook(() => useMediaQuery("(min-width: 480px)"));
      expect(result.current).toBe(false);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
