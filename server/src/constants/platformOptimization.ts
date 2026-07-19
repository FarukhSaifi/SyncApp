/**
 * Platform-specific AI optimization targets (Phase 1: DEV.to + LinkedIn).
 * LinkedIn: short summary + Read more URL; OAuth publish posts that summary.
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
- Prioritize actionable depth, working examples, and scannability for the DEV community.
- content_markdown is the full article. Do not put LinkedIn teaser text in content_markdown.`,

  linkedin: `### LinkedIn Optimization (summary + Read more)
- content_markdown MUST still be the FULL blog article readers open on the website (${AI_POST_LIMITS.SOFT_WORD_GUIDANCE}, Markdown, headings, examples). Do NOT put emojis in content_markdown unless natural in code comments.
- ALSO fill linkedin_post with a SHORT native LinkedIn post (plain text, NOT Markdown headings/code fences):
  - Hook in the first 2 lines (LinkedIn truncates with "see more").
  - Short paragraphs (1–3 sentences). Length ~${AI_POST_LIMITS.LINKEDIN_POST_MIN_CHARS}–${AI_POST_LIMITS.LINKEDIN_POST_MAX_CHARS} characters.
  - **Emojis (required for engagement):** Use 3–8 relevant emojis to make the post scannable and interactive — e.g. line-openers (🚀 💡 ✅ 🔥), bullet markers, and a light CTA emoji. Prefer tech-friendly emojis; never spam or use decorative emoji walls.
  - End with 3–5 relevant hashtags on their own line (e.g. #WebDev #JavaScript).
  - Soft CTA is fine ("What's your take? 👇").
  - Do NOT invent a domain. Do NOT include a "Read more:" URL — the server inserts the real link before the hashtags.
- tags JSON field: still exactly ${AI_POST_LIMITS.TAG_COUNT} lowercase DEV.to-style tags (no # in JSON).`,
};

const BLENDED_BOTH_RULES = `### Blended DEV.to + LinkedIn (dual output — CRITICAL)
- Produce TWO deliverables in one JSON response:
  1) content_markdown = full DEV.to-style article (headings, code, lists, depth) — keep professional; minimal/no emoji.
  2) linkedin_post = separate short LinkedIn teaser (plain text + strategic emojis + hashtags).
- Do NOT merge the LinkedIn teaser into content_markdown.
- Do NOT put DEV.to Markdown structure into linkedin_post.
- Open the full article with a strong hook; LinkedIn teaser has its own emoji-assisted hook.
- tags JSON field: exactly ${AI_POST_LIMITS.TAG_COUNT} lowercase DEV.to tags (no #).`;

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

export function includesLinkedInTarget(targets?: string[]): boolean {
  return normalizeTargets(targets).includes(AI_OPTIMIZATION_TARGETS.LINKEDIN);
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

export function buildFullPostUserPrompt(
  keyword: string,
  targets?: string[],
  options?: { readMoreUrl?: string },
): string {
  const resolved = normalizeTargets(targets);
  const platformLabels = resolved.map((t) => OPTIMIZATION_TARGET_LABELS[t]).join(" and ");
  let prompt = `${AI_PROMPTS.FULL_POST_USER(keyword)}\n\nOptimize this draft primarily for: ${platformLabels}.`;

  if (resolved.includes(AI_OPTIMIZATION_TARGETS.LINKEDIN)) {
    prompt += `\n\nLinkedIn: fill linkedin_post with a short interactive teaser that includes strategic emojis (3–8). Do not invent a Read more URL.`;
    if (options?.readMoreUrl) {
      prompt += ` The live article URL will be: ${options.readMoreUrl} (server appends it — do not invent another domain).`;
    } else {
      prompt += ` No public blog base URL is configured yet — write linkedin_post without any URL.`;
    }
  }

  return prompt;
}
