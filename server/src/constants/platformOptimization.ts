/**
 * Platform-specific AI optimization targets (Phase 1: DEV.to + LinkedIn).
 * LinkedIn is optimize-only until Phase 2 publish integration.
 */
import { AI_POST_LIMITS, AI_PROMPTS } from "./ai";

export const AI_OPTIMIZATION_TARGETS = Object.freeze({
  DEVTO: "devto",
  LINKEDIN: "linkedin",
} as const);

export type OptimizationTarget = (typeof AI_OPTIMIZATION_TARGETS)[keyof typeof AI_OPTIMIZATION_TARGETS];

export const VALID_OPTIMIZATION_TARGETS = Object.freeze(Object.values(AI_OPTIMIZATION_TARGETS)) as OptimizationTarget[];

export const DEFAULT_OPTIMIZATION_TARGETS: OptimizationTarget[] = [AI_OPTIMIZATION_TARGETS.DEVTO];

export const OPTIMIZATION_TARGET_LABELS: Record<OptimizationTarget, string> = {
  devto: "DEV.to",
  linkedin: "LinkedIn",
};

const PLATFORM_OPTIMIZATION_RULES: Record<OptimizationTarget, string> = {
  devto: `### DEV.to Optimization
- Write as a long-form developer article (${AI_POST_LIMITS.SOFT_WORD_GUIDANCE}).
- Use Markdown with ##/### headings, code blocks, lists, and > blockquotes where helpful.
- tags must be exactly ${AI_POST_LIMITS.TAG_COUNT} lowercase strings without # (2 high-reach + 2 stack-specific).
- Title 30–60 chars; meta_description 120–150 chars for search CTR.
- Prioritize actionable depth, working examples, and scannability for the DEV community.`,

  linkedin: `### LinkedIn Optimization (content format only — user may copy/paste)
- Professional, confident tone; avoid overly casual slang.
- **Hook (CRITICAL):** The first 2 lines must stop the scroll — strong insight or bold claim before any fluff (LinkedIn truncates with "see more").
- Short paragraphs (1–3 sentences). Minimal heavy Markdown — prefer plain text, line breaks, and simple bullets.
- End content_markdown with a standalone line of 3–5 relevant hashtags (e.g. #WebDev #JavaScript).
- Length: ~500–900 words unless the topic truly needs more; stay punchy and value-dense.
- Include a soft CTA when natural (e.g. "What's your experience?" — no hard sell).`,
};

const BLENDED_BOTH_RULES = `### Blended DEV.to + LinkedIn (single draft)
- Produce ONE content_markdown that works for both: DEV.to depth + LinkedIn readability.
- Open with a LinkedIn-style hook in the first 2 lines, then expand with DEV.to-style structure (headings, code, lists).
- Keep paragraphs short throughout; use headings and code for DEV.to, but avoid walls of text.
- End with 3–5 hashtags on their own line after the main body.
- tags JSON field: still exactly ${AI_POST_LIMITS.TAG_COUNT} lowercase DEV.to tags (no # in JSON).`;

function normalizeTargets(targets?: string[]): OptimizationTarget[] {
  if (!targets?.length) return [...DEFAULT_OPTIMIZATION_TARGETS];

  const normalized = targets
    .map((t) => t.trim().toLowerCase())
    .filter((t): t is OptimizationTarget => VALID_OPTIMIZATION_TARGETS.includes(t as OptimizationTarget));

  return normalized.length > 0 ? [...new Set(normalized)] : [...DEFAULT_OPTIMIZATION_TARGETS];
}

export function isValidOptimizationTargets(targets: string[]): boolean {
  if (!Array.isArray(targets) || targets.length === 0) return false;
  return targets.every((t) => VALID_OPTIMIZATION_TARGETS.includes(t.trim().toLowerCase() as OptimizationTarget));
}

export function resolveOptimizationTargets(targets?: string[]): OptimizationTarget[] {
  return normalizeTargets(targets);
}

export function buildFullPostSystemPrompt(targets?: string[]): string {
  const resolved = normalizeTargets(targets);
  const platformBlocks = resolved.map((t) => PLATFORM_OPTIMIZATION_RULES[t]).join("\n\n");
  const blended =
    resolved.includes(AI_OPTIMIZATION_TARGETS.DEVTO) && resolved.includes(AI_OPTIMIZATION_TARGETS.LINKEDIN)
      ? `\n\n${BLENDED_BOTH_RULES}`
      : "";

  return `${AI_PROMPTS.FULL_POST_SYSTEM_BASE}\n\n${platformBlocks}${blended}`;
}

export function buildFullPostUserPrompt(keyword: string, targets?: string[]): string {
  const resolved = normalizeTargets(targets);
  const platformLabels = resolved.map((t) => OPTIMIZATION_TARGET_LABELS[t]).join(" and ");
  return `${AI_PROMPTS.FULL_POST_USER(keyword)}\n\nOptimize this draft primarily for: ${platformLabels}.`;
}
