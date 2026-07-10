/**
 * Persisted AI model and optimization-target preferences (localStorage).
 */
import { resolveStoredContentModel } from "@constants/ai";
import { DEFAULT_OPTIMIZATION_TARGETS, VALID_OPTIMIZATION_TARGETS } from "@constants/platforms";
import { STORAGE_KEYS } from "@constants/theme";

export function readStoredAiModel(): string {
  if (typeof window === "undefined") return resolveStoredContentModel(null);
  return resolveStoredContentModel(localStorage.getItem(STORAGE_KEYS.AI_CONTENT_MODEL));
}

export function readStoredOptimizationTargets(): string[] {
  if (typeof window === "undefined") return [...DEFAULT_OPTIMIZATION_TARGETS];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_OPTIMIZATION_TARGETS);
    if (!raw) return [...DEFAULT_OPTIMIZATION_TARGETS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_OPTIMIZATION_TARGETS];
    const valid = parsed.filter((t): t is string =>
      VALID_OPTIMIZATION_TARGETS.includes(t as (typeof VALID_OPTIMIZATION_TARGETS)[number]),
    );
    return valid.length > 0 ? valid : [...DEFAULT_OPTIMIZATION_TARGETS];
  } catch {
    return [...DEFAULT_OPTIMIZATION_TARGETS];
  }
}

export function persistAiModel(model: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.AI_CONTENT_MODEL, model);
  }
}

export function persistOptimizationTargets(targets: string[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.AI_OPTIMIZATION_TARGETS, JSON.stringify(targets));
  }
}
