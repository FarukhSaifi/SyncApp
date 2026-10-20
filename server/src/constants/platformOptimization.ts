/**
 * Platform-specific AI optimization targets (DEV.to, LinkedIn, Google Search SEO).
 * LinkedIn: short summary + Read more URL; OAuth publish posts that summary.
 * Google: SERP / long-tail SEO structure (not a SyncApp publish destination).
 */
import type { GeneratePostResearchContext } from "@types";

import { AI_POST_LIMITS, AI_PROMPTS } from "./ai";
import { PLATFORM_TAG_LIMITS } from "./platformTags";

export const AI_OPTIMIZATION_TARGETS = Object.freeze({
  DEVTO: "devto",
  LINKEDIN: "linkedin",
  GOOGLE: "google",
} as const);

export type OptimizationTarget = (typeof AI_OPTIMIZATION_TARGETS)[keyof typeof AI_OPTIMIZATION_TARGETS];

export const VALID_OPTIMIZATION_TARGETS = Object.freeze(Object.values(AI_OPTIMIZATION_TARGETS)) as OptimizationTarget[];

export const DEFAULT_OPTIMIZATION_TARGETS: OptimizationTarget[] = [AI_OPTIMIZATION_TARGETS["DEVTO"]];

export const OPTIMIZATION_TARGET_LABELS: Record<OptimizationTarget, string> = {
  devto: "DEV.to",
  linkedin: "LinkedIn",
  google: "Google",
};

function normalizeTargets(targets?: string[]): OptimizationTarget[] {
  if (!targets?.length) {
    return [...DEFAULT_OPTIMIZATION_TARGETS];
  }

  const normalized = targets
    .map((t) => t.trim().toLowerCase())
    .filter((t): t is OptimizationTarget => VALID_OPTIMIZATION_TARGETS.includes(t as OptimizationTarget));

  return normalized.length > 0 ? [...new Set(normalized)] : [...DEFAULT_OPTIMIZATION_TARGETS];
}

export function isValidOptimizationTargets(targets: string[]): boolean {
  if (!Array.isArray(targets) || targets.length === 0) {
    return false;
  }
  return targets.every((t) => VALID_OPTIMIZATION_TARGETS.includes(t.trim().toLowerCase() as OptimizationTarget));
}

export function resolveOptimizationTargets(targets?: string[]): OptimizationTarget[] {
  return normalizeTargets(targets);
}

export function includesLinkedInTarget(targets?: string[]): boolean {
  return normalizeTargets(targets).includes(AI_OPTIMIZATION_TARGETS["LINKEDIN"]);
}

export function includesDevtoTarget(targets?: string[]): boolean {
  return normalizeTargets(targets).includes(AI_OPTIMIZATION_TARGETS["DEVTO"]);
}

export function includesGoogleTarget(targets?: string[]): boolean {
  return normalizeTargets(targets).includes(AI_OPTIMIZATION_TARGETS["GOOGLE"]);
}

/**
 * Article `tags` JSON / post.tags limit for AI generation.
 * DEV.to-involved → 4 (API hard max). LinkedIn (no DEV.to) → 5. Google-only → SEO topical tags.
 */
export function resolveArticleTagLimit(targets?: string[]): number {
  const resolved = normalizeTargets(targets);
  if (resolved.includes(AI_OPTIMIZATION_TARGETS["DEVTO"])) {
    return PLATFORM_TAG_LIMITS["DEVTO"]["MAX"];
  }
  if (resolved.includes(AI_OPTIMIZATION_TARGETS["LINKEDIN"])) {
    return PLATFORM_TAG_LIMITS["LINKEDIN"]["MAX"];
  }
  if (resolved.includes(AI_OPTIMIZATION_TARGETS["GOOGLE"])) {
    return PLATFORM_TAG_LIMITS["GOOGLE"]["IDEAL"];
  }
  return PLATFORM_TAG_LIMITS["DEVTO"]["MAX"];
}

/** Hashtag count for LinkedIn commentary (ideal = max = 5). */
export function resolveLinkedInHashtagLimit(): number {
  return PLATFORM_TAG_LIMITS["LINKEDIN"]["IDEAL"];
}

const PLATFORM_OPTIMIZATION_RULES: Record<OptimizationTarget, string> = {
  devto: `### DEV.to Optimization
- Write as a long-form developer article (${AI_POST_LIMITS["SOFT_WORD_GUIDANCE"]}).
- Use Markdown with ##/### headings, code blocks, lists, and > blockquotes where helpful.
- tags must be exactly ${PLATFORM_TAG_LIMITS["DEVTO"]["IDEAL"]} lowercase strings without # (2 high-reach + 2 stack-specific). DEV.to allows a maximum of ${PLATFORM_TAG_LIMITS["DEVTO"]["MAX"]} tags.
- Title 30–60 chars; meta_description 120–150 chars for search CTR.
- Prioritize actionable depth, working examples, and scannability for the DEV community.
- content_markdown is the full article. Do not put LinkedIn teaser text in content_markdown.`,

  linkedin: `### LinkedIn Optimization (summary + Read more)
- content_markdown MUST still be the FULL blog article readers open on the website (${AI_POST_LIMITS["SOFT_WORD_GUIDANCE"]}, Markdown, headings, examples). Do NOT put emojis in content_markdown unless natural in code comments.
- ALSO fill linkedin_post with a SHORT native LinkedIn post (plain text, NOT Markdown headings/code fences):
  - Hook in the first 2 lines (LinkedIn truncates with "see more").
  - Short paragraphs (1–3 sentences). Length ~${AI_POST_LIMITS["LINKEDIN_POST_MIN_CHARS"]}–${AI_POST_LIMITS["LINKEDIN_POST_MAX_CHARS"]} characters.
  - **Emojis (required for engagement):** Use 3–8 relevant emojis to make the post scannable and interactive — e.g. line-openers (🚀 💡 ✅ 🔥), bullet markers, and a light CTA emoji. Prefer tech-friendly emojis; never spam or use decorative emoji walls.
  - End with exactly ${PLATFORM_TAG_LIMITS["LINKEDIN"]["IDEAL"]} relevant hashtags on their own line (e.g. #WebDev #JavaScript #TypeScript #React #OpenSource). LinkedIn best reach is ${PLATFORM_TAG_LIMITS["LINKEDIN"]["MIN"]}–${PLATFORM_TAG_LIMITS["LINKEDIN"]["MAX"]} highly relevant hashtags — use ${PLATFORM_TAG_LIMITS["LINKEDIN"]["IDEAL"]}, never more than ${PLATFORM_TAG_LIMITS["LINKEDIN"]["MAX"]}.
  - Soft CTA is fine ("What's your take? 👇").
  - Do NOT invent a domain. Do NOT include a "Read more:" URL — the server inserts the real link before the hashtags.
- When LinkedIn is the only target, tags JSON field: exactly ${PLATFORM_TAG_LIMITS["LINKEDIN"]["IDEAL"]} lowercase topic tags without # (source for editor + hashtags).
- When DEV.to is also a target, tags JSON field stays at ${PLATFORM_TAG_LIMITS["DEVTO"]["IDEAL"]} DEV.to tags (no #); LinkedIn hashtags live only in linkedin_post.`,

  google: `### Google Search SEO Optimization
- Optimize content_markdown to rank for the primary long-tail query and closely related intents.
- Title 30–60 chars with the primary keyword near the front; meta_description 120–150 chars with a clear CTR promise (no clickbait).
- Structure for SERPs: one H1-equivalent title, scannable ##/### headings that mirror search intents, early answer / featured-snippet box (35–50 words under the first H2).
- Natural keyword density — no stuffing. Cover people-also-ask angles with concrete steps, code, and definitions.
- Prefer E-E-A-T: experience cues, accurate commands/versions, honest caveats.
- tags JSON: topical SEO keywords (lowercase, no #) that match the query cluster — count is set per request tag limit.
- Google is an SEO target only (not a SyncApp publish destination). Do not invent Search Console or Analytics claims.`,
};

const BLENDED_BOTH_RULES = `### Blended DEV.to + LinkedIn (dual output — CRITICAL)
- Produce TWO deliverables in one JSON response:
  1) content_markdown = full DEV.to-style article (headings, code, lists, depth) — keep professional; minimal/no emoji.
  2) linkedin_post = separate short LinkedIn teaser (plain text + strategic emojis + exactly ${PLATFORM_TAG_LIMITS["LINKEDIN"]["IDEAL"]} hashtags).
- Do NOT merge the LinkedIn teaser into content_markdown.
- Do NOT put DEV.to Markdown structure into linkedin_post.
- Open the full article with a strong hook; LinkedIn teaser has its own emoji-assisted hook.
- tags JSON field: exactly ${PLATFORM_TAG_LIMITS["DEVTO"]["IDEAL"]} lowercase DEV.to tags (no #) — API max ${PLATFORM_TAG_LIMITS["DEVTO"]["MAX"]}.`;

export function buildFullPostSystemPrompt(
  targets?: string[],
  researchContext?: GeneratePostResearchContext,
): string {
  const resolved = normalizeTargets(targets);
  const tagLimit = resolveArticleTagLimit(resolved);
  const platformBlocks = resolved.map((t) => PLATFORM_OPTIMIZATION_RULES[t]).join("\n\n");
  const blended =
    resolved.includes(AI_OPTIMIZATION_TARGETS["DEVTO"]) && resolved.includes(AI_OPTIMIZATION_TARGETS["LINKEDIN"])
      ? `\n\n${BLENDED_BOTH_RULES}`
      : "";

  const tagRuleOverride = `\n\n### Tag count for this request
- tags JSON array must contain exactly ${tagLimit} lowercase strings without #.`;

  const angle = researchContext?.monetizationAngle?.trim();
  const intent = researchContext?.intentLabel?.trim();
  const monetizationBlock =
    angle && intent ? `\n\n${AI_PROMPTS.MONETIZATION_RESEARCH_SYSTEM(angle, intent)}` : "";

  return `${AI_PROMPTS.FULL_POST_SYSTEM_BASE}\n\n${platformBlocks}${blended}${tagRuleOverride}${monetizationBlock}`;
}

export function buildFullPostUserPrompt(
  keyword: string,
  targets?: string[],
  options?: {
    readMoreUrl?: string;
    researchContext?: GeneratePostResearchContext;
  },
): string {
  const resolved = normalizeTargets(targets);
  const platformLabels = resolved.map((t) => OPTIMIZATION_TARGET_LABELS[t]).join(" and ");
  const tagLimit = resolveArticleTagLimit(resolved);
  let prompt = `${AI_PROMPTS.FULL_POST_USER(keyword)}\n\nOptimize this draft primarily for: ${platformLabels}.
Use exactly ${tagLimit} tags in the JSON tags array.`;

  const angle = options?.researchContext?.monetizationAngle?.trim();
  const intent = options?.researchContext?.intentLabel?.trim();
  if (angle && intent) {
    prompt += `\n\nWrite this draft for ${intent} search intent with monetization angle: ${angle}.`;
  }

  if (resolved.includes(AI_OPTIMIZATION_TARGETS["LINKEDIN"])) {
    const hashtagCount = resolveLinkedInHashtagLimit();
    prompt += `\n\nLinkedIn: fill linkedin_post with a short interactive teaser that includes strategic emojis (3–8) and exactly ${hashtagCount} hashtags on the final line. Do not invent a Read more URL.`;
    if (options?.readMoreUrl) {
      prompt += ` The live article URL will be: ${options.readMoreUrl} (server appends it — do not invent another domain).`;
    } else {
      prompt += ` No public blog base URL is configured yet — write linkedin_post without any URL.`;
    }
  }

  if (resolved.includes(AI_OPTIMIZATION_TARGETS["GOOGLE"])) {
    prompt += `\n\nGoogle: prioritize SERP-ready structure for the primary query — snippet answer under the first H2, intent-matched headings, and natural keyword placement in title/meta/H2s.`;
  }

  return prompt;
}
