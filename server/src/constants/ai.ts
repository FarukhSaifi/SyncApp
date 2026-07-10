/**
 * AI (Vertex AI) constants: prompts, config keys and safety settings for the AI service.
 * Optimized for DEV.to/Medium community ranking, Google Search E-E-A-T, and high humanization.
 */
import { HarmBlockThreshold, HarmCategory, Type } from "@google/genai";

/** DEV.to + Google ranking constraints referenced by prompts and downstream validation. */
export const AI_POST_LIMITS = Object.freeze({
  TITLE_MIN: 30,
  TITLE_MAX: 60,
  META_DESC_MAX: 150,
  /** DEV.to API allows max 4 tags per article. */
  TAG_COUNT: 4,
  COVER_WIDTH: 1000,
  COVER_HEIGHT: 420,
  PARAGRAPH_MAX_SENTENCES: 3,
  /** No minimum word count — length scales to topic complexity, search intent, and value depth. */
  NO_MIN_WORD_COUNT: true,
  /** Editorial guidance for the model; value density matters more than word count. */
  SOFT_WORD_GUIDANCE: "800-1200 words for a focused, high-value blog; never fluff or pad to hit a target.",
} as const);

/** Curated Gemini models exposed to the client model picker. */
export const AI_CONTENT_MODELS = Object.freeze([
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (default, fast)" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (lighter)" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview (quality)" },
] as const);

export type AiContentModelId = (typeof AI_CONTENT_MODELS)[number]["id"];

const ALLOWED_CONTENT_MODEL_IDS = new Set<string>(AI_CONTENT_MODELS.map((m) => m.id));

export function isAllowedContentModel(model: string): boolean {
  return ALLOWED_CONTENT_MODEL_IDS.has(model.trim());
}

const PLATFORM_TAG_GUIDANCE = `exactly ${AI_POST_LIMITS.TAG_COUNT} lowercase tags without #. Prefer relevant developer/tech tags (e.g. webdev, programming, javascript, tutorial, nextjs, react, typescript). No hyphens or spaces in tag names.`;

const FULL_POST_SYSTEM_BODY = `### Tone & Humanization (CRITICAL)
- **Sound Human:** Write conversationally, as if explaining a concept to a respected colleague over coffee.
- **Avoid AI Clichés:** NEVER use phrases like "In today's fast-paced digital world," "Delve into," "Demystify," "Unleash the power of," "Buckle up," or "In conclusion."
- **Vary Sentence Structure:** Mix short, punchy sentences with longer, descriptive ones.
- **Formatting:** Use short paragraphs (max ${AI_POST_LIMITS.PARAGRAPH_MAX_SENTENCES} sentences). Use bold text for emphasis.

### SEO & Platform Optimization (E-E-A-T)
- **Search Intent:** Answer the user's implicit questions immediately. Provide actionable, practical advice, not just theory.
- **Structure:** Use a compelling hook in the introduction. Include a logical hierarchy with clear headings (##, ###).
- **Rich Elements:** Use Markdown effectively. Include > blockquotes for important callouts, bulleted/numbered lists for scannability, and relevant code snippets or structured examples where applicable.
- **Keywords:** Naturally weave in primary and LSI (Latent Semantic Indexing) keywords without keyword stuffing.

CONCISENESS (quality over word count)
- No minimum word count. Length scales to topic complexity (${AI_POST_LIMITS.SOFT_WORD_GUIDANCE}).
- Stop the moment the reader's problem is fully solved. Do not stretch a solvable topic to hit an arbitrary length.
- Never repeat points, restate the intro, or add generic transitions.
- Ban filler patterns: "In conclusion", "It's worth noting", "Let's dive in", recap paragraphs, duplicated explanations.
- Prefer dense code + short explanation over long prose.

OUTPUT RULES:
- Do NOT include YAML front matter in content_markdown — metadata goes in the JSON fields only.
- tags must be ${PLATFORM_TAG_GUIDANCE}
- canonical_url must be an empty string (the app sets this on publish).
- content_markdown must be the complete, concise post body in Markdown only — no filler.
You MUST output a valid JSON object matching this exact schema. Do not output markdown code blocks wrapping the JSON:
{
  "title": "A highly clickable, curiosity-inducing, SEO-optimized title (30-60 characters)",
  "meta_description": "A punchy summary that drives CTR in search results (120-150 characters)",
  "tags": ["webdev", "programming", "nextjs", "typescript"],
  "content_markdown": "The full, highly detailed, humanized blog post in markdown format",
  "canonical_url": ""
}`;

export const AI_PROMPTS = {
  // Base rules; platform blocks appended by buildFullPostSystemPrompt()
  FULL_POST_SYSTEM_BASE: `You are an expert technical writer, SEO specialist, and engaging technical storyteller. Your task is to write a comprehensive, highly optimized blog post that ranks on Google and performs well on the user's selected publishing platforms.

${FULL_POST_SYSTEM_BODY}`,

  FULL_POST_USER: (keyword: string) =>
    `Write a complete, high-quality technical blog post about: "${keyword}".

Make it genuinely useful for developers. Include a clear title, ${AI_POST_LIMITS.TAG_COUNT} relevant tags, meta description, and well-structured markdown content. Stop when the problem is solved — do not pad word count.`,

  // Optimise an existing draft before publishing (any platform)
  OPTIMISE_FOR_PUBLISH_SYSTEM: `You are an expert technical editor preparing a blog post for publication on Medium, DEV.to, WordPress, or a personal site.

Optimize the draft without changing core facts or code examples:

### Metadata
- Title: ${AI_POST_LIMITS.TITLE_MIN}–${AI_POST_LIMITS.TITLE_MAX} chars; specific and keyword-frontloaded.
- Tags: ${PLATFORM_TAG_GUIDANCE}
- Meta description: under ${AI_POST_LIMITS.META_DESC_MAX} chars.
- canonical_url: always return an empty string.

### Content
- Fix heading hierarchy (## / ### only).
- Tighten intro; add a direct answer block if missing.
- Label code fences; shorten paragraphs; remove filler and AI clichés.
- Keep working code and technical accuracy.

Return ONLY JSON with keys: title, meta_description, tags, content_markdown, canonical_url.`,

  OPTIMISE_FOR_PUBLISH_USER: (input: {
    title: string;
    meta_description?: string;
    tags?: string[];
    content_markdown: string;
  }) =>
    `Optimise this draft for publication:

TITLE: ${input.title || "(untitled)"}
META DESCRIPTION: ${input.meta_description || "(none)"}
TAGS: ${(input.tags || []).join(", ") || "(none)"}

CONTENT:
---
${input.content_markdown.slice(0, 12000)}
---`,

  // Image from topic – optimized for DEV.to cover (1000×420)
  IMAGE_FROM_TOPIC_SYSTEM: `You are a prompt engineer for high-CTR blog featured images at ${AI_POST_LIMITS.COVER_WIDTH}×${AI_POST_LIMITS.COVER_HEIGHT}px. Given a blog topic, output a single short image prompt (1-2 sentences, under 80 words). Style: professional, modern, conceptual — suitable for a developer blog cover. No text or watermarks. Output ONLY the prompt.`,

  IMAGE_FROM_TOPIC_USER: (topic: string, additionalPrompt?: string) =>
    `Create a cover image prompt for a ${AI_POST_LIMITS.COVER_WIDTH}×${AI_POST_LIMITS.COVER_HEIGHT}px blog header based on this topic:\n\n${topic.slice(0, 1500)}${
      additionalPrompt ? `\n\nAdditional instructions:\n${additionalPrompt.slice(0, 500)}` : ""
    }`,

  // Inline Editor Tools
  EDITOR_TOOL_SYSTEM: `You are an AI Markdown editor assistant for technical blog posts.

When editing or generating text, enforce:
- Heading hierarchy: ## for main sections, ### for sub-sections.
- Short paragraphs (max ${AI_POST_LIMITS.PARAGRAPH_MAX_SENTENCES} sentences), no filler.
- Labeled code fences; **bold** key terms; human tone.

Return ONLY the edited markdown. No filler like "Here is the revised text:".`,

  EDITOR_TOOL_USER: (action: string, context: string) =>
    `Perform this editing action: "${action}".
Here is the selected or surrounding text context:
---
${context}
---
Output ONLY the resulting markdown text.`,
};

export const AI_CONFIG = Object.freeze({
  ENV_GOOGLE_CLOUD_PROJECT: "GOOGLE_CLOUD_PROJECT",
  ENV_GOOGLE_CLOUD_LOCATION: "GOOGLE_CLOUD_LOCATION",
  ENV_GOOGLE_APPLICATION_CREDENTIALS: "GOOGLE_APPLICATION_CREDENTIALS",
  ENV_GOOGLE_AI_MODEL: "GOOGLE_AI_MODEL",
  /** Google AI Studio API key — bypasses Vertex billing for text generation (local dev). */
  ENV_GEMINI_API_KEY: "GEMINI_API_KEY",
  /** Alternate env name supported by @google/genai SDK. */
  ENV_GOOGLE_API_KEY: "GOOGLE_API_KEY",
  GEMINI_API_KEY_URL: "https://aistudio.google.com/apikey",
  /** Default model — Vertex AI usage-based free tier (~1,000 requests/day, rate-limited). */
  DEFAULT_MODEL: "gemini-3.5-flash",
  /** Documented Vertex AI free-tier daily request cap. */
  VERTEX_FREE_TIER_DAILY_REQUESTS: 1000,
  /** Gemini models that require the global Vertex endpoint (not regional us-central1). */
  VERTEX_GLOBAL_MODEL_PREFIXES: [
    "gemini-3.5-flash",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite",
  ] as readonly string[],
  /** Tried when primary model/region fails (404, schema, or thinking errors). */
  FALLBACK_MODELS: [
    { model: "gemini-3.5-flash", location: "global" },
    { model: "gemini-3.1-flash-lite", location: "global" },
    { model: "gemini-2.5-flash", location: "us-central1" },
  ] as readonly { model: string; location: string }[],
  DEFAULT_VERTEX_LOCATION: "global",
  VERTEX_GLOBAL_FALLBACK_LOCATION: "global",
  /**
   * Output token caps (maxOutputTokens). On Gemini 2.5+/3.x Flash, internal "thinking"
   * tokens count toward this budget — see FLASH_THINKING_BUDGET in aiService.
   */
  MAX_OUTLINE_TOKENS: 2048,
  /** Full-post JSON: ~800–1200 words + title/meta/tags. 8192 is enough with thinking off. */
  MAX_DRAFT_TOKENS: 8192,
  /** Optimise-for-publish: same budget as full post generation. */
  MAX_OPTIMISE_TOKENS: 8192,
  /** Image prompt (~80 words). 512 is sufficient with thinking off. */
  MAX_IMAGE_PROMPT_TOKENS: 512,
  /** 0 = disable Flash thinking so maxOutputTokens goes to visible JSON/text, not reasoning. */
  FLASH_THINKING_BUDGET: 0,
  IMAGEN_MODEL: "imagen-4.0-fast-generate-001",
} as const);

/** Resolve request model or fall back to env default. */
export function resolveContentModel(requested?: string): string {
  const trimmed = requested?.trim();
  if (trimmed && isAllowedContentModel(trimmed)) return trimmed;
  return process.env[AI_CONFIG.ENV_GOOGLE_AI_MODEL] || AI_CONFIG.DEFAULT_MODEL;
}

/**
 * Default safety settings applied to every Gemini generateContent() call.
 * BLOCK_MEDIUM_AND_ABOVE is the recommended balanced threshold.
 */
export const AI_SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export const AI_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    meta_description: { type: Type.STRING },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    content_markdown: { type: Type.STRING },
    canonical_url: { type: Type.STRING },
  },
  required: ["title", "meta_description", "tags", "content_markdown"],
};

export const AI_SYSTEM_INSTRUCTIONS = Object.freeze({
  BASE: "You are an expert technical assistant. Respond clearly, concisely, and conversationally. Prioritize factual accuracy and avoid generic fluff. Do not produce harmful, illegal, or deceptive content.",
} as const);
