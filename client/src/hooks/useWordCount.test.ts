import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EDITOR_DEBOUNCE_MS, READING_SPEED_WPM } from "@constants/editor";

import { useWordCount } from "./useWordCount";

describe("useWordCount", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts words after debounce and strips HTML", () => {
    const { result, rerender } = renderHook(({ content }) => useWordCount(content), {
      initialProps: { content: "<p>one two three</p>" },
    });

    act(() => {
      vi.advanceTimersByTime(EDITOR_DEBOUNCE_MS);
    });

    expect(result.current.words).toBe(3);
    expect(result.current.characters).toBeGreaterThan(0);
    expect(result.current.readingTimeMinutes).toBe(
      Math.max(1, Math.ceil(3 / READING_SPEED_WPM)),
    );

    rerender({ content: "" });
    act(() => {
      vi.advanceTimersByTime(EDITOR_DEBOUNCE_MS);
    });
    expect(result.current.words).toBe(0);
    expect(result.current.readingTimeMinutes).toBe(0);
  });
});
