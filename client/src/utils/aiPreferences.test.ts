import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_AI_CONTENT_MODEL } from "@constants/ai";
import { DEFAULT_OPTIMIZATION_TARGETS, OPTIMIZATION_TARGETS } from "@constants/platforms";
import { STORAGE_KEYS } from "@constants/theme";

import {
  persistAiModel,
  persistOptimizationTargets,
  readStoredAiModel,
  readStoredOptimizationTargets,
} from "./aiPreferences";

describe("aiPreferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns defaults when storage is empty", () => {
    expect(readStoredAiModel()).toBe(DEFAULT_AI_CONTENT_MODEL);
    expect(readStoredOptimizationTargets()).toEqual([...DEFAULT_OPTIMIZATION_TARGETS]);
  });

  it("persists and reads AI model", () => {
    persistAiModel("gemini-3.8-flash");
    expect(localStorage.getItem(STORAGE_KEYS.AI_CONTENT_MODEL)).toBe("gemini-3.8-flash");
    expect(readStoredAiModel()).toBe("gemini-3.8-flash");
  });

  it("filters invalid optimization targets and falls back when empty", () => {
    localStorage.setItem(STORAGE_KEYS.AI_OPTIMIZATION_TARGETS, JSON.stringify(["not-a-target"]));
    expect(readStoredOptimizationTargets()).toEqual([...DEFAULT_OPTIMIZATION_TARGETS]);

    persistOptimizationTargets([OPTIMIZATION_TARGETS.DEVTO, OPTIMIZATION_TARGETS.LINKEDIN]);
    expect(readStoredOptimizationTargets()).toEqual([
      OPTIMIZATION_TARGETS.DEVTO,
      OPTIMIZATION_TARGETS.LINKEDIN,
    ]);
  });

  it("falls back on malformed JSON", () => {
    localStorage.setItem(STORAGE_KEYS.AI_OPTIMIZATION_TARGETS, "{broken");
    expect(readStoredOptimizationTargets()).toEqual([...DEFAULT_OPTIMIZATION_TARGETS]);
  });

  it("returns defaults on SSR when window is undefined", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    try {
      expect(readStoredAiModel()).toBe(DEFAULT_AI_CONTENT_MODEL);
      expect(readStoredOptimizationTargets()).toEqual([...DEFAULT_OPTIMIZATION_TARGETS]);
      persistAiModel("ignored-on-ssr");
      persistOptimizationTargets([OPTIMIZATION_TARGETS.DEVTO]);
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("falls back when stored optimization targets JSON is not an array", () => {
    localStorage.setItem(STORAGE_KEYS.AI_OPTIMIZATION_TARGETS, JSON.stringify({ targets: [] }));
    expect(readStoredOptimizationTargets()).toEqual([...DEFAULT_OPTIMIZATION_TARGETS]);
  });
});
