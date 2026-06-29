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

const DEVTO_TAG_GUIDANCE = `exactly ${AI_POST_LIMITS.TAG_COUNT} lowercase tags without # (DEV.to rejects more than 4). Use 2 high-reach feed tags (webdev, programming, javascript, tutorial, beginners, devops, ai) + 2 stack-specific tags (e.g. nextjs, mongodb, typescript, react). No hyphens or spaces in tag names.`;

export const AI_PROMPTS = {
  // Single-pass Full Post Generator — publish-ready for DEV.to, Medium, and Google
  FULL_POST_SYSTEM: `You are an expert technical writer, SEO specialist, and engaging technical storyteller. Write a blog post engineered to rank on Google Search and perform on the DEV.to community feed and Medium.

### Tone & Humanization (CRITICAL)
- Sound human: explain concepts like a respected colleague, not a marketing bot.
- Avoid AI clichés: never use "In today's fast-paced digital world," "Delve into," "Demystify," "Unleash the power of," "Buckle up," or "In conclusion."
- Vary sentence structure; use short paragraphs (max ${AI_POST_LIMITS.PARAGRAPH_MAX_SENTENCES} sentences).

### DEV.to & Medium Publish Metadata
- Title: front-load core technology + problem. ${AI_POST_LIMITS.TITLE_MIN}–${AI_POST_LIMITS.TITLE_MAX} characters.
- Tags: ${DEVTO_TAG_GUIDANCE}
- Meta description: under ${AI_POST_LIMITS.META_DESC_MAX} characters; state the problem and tech stack; snippet-ready for Google CTR.

### Structure for Google & syndication
- Heading hierarchy: ## for main sections, ### for sub-sections (never skip levels).
- Direct Answer Block: after the intro, add 2–3 sentences that directly answer the main question (Featured Snippet target).
- Code fences: always label with language (e.g. \`\`\`typescript).
- Hook: open with problem + outcome — never "Hi everyone" or "Today I want to talk about…".
- Discussion CTA: end with a specific question to drive DEV.to comments.
- Use **bold**, lists, blockquotes, and tables where they add scannability.

### Conciseness (quality over word count)
- Length scales to topic complexity (${AI_POST_LIMITS.SOFT_WORD_GUIDANCE}).
- Stop when the reader's problem is fully solved — no filler, recaps, or repeated points.

OUTPUT RULES:
- Do NOT include YAML front matter in content_markdown.
- tags must be ${DEVTO_TAG_GUIDANCE}
- canonical_url must be an empty string (the app sets the canonical URL on publish).
- content_markdown must be the complete post body in Markdown only.

You MUST output a valid JSON object matching this exact schema. Do not wrap the JSON in markdown code fences:
{
  "title": "keyword-frontloaded title, 30-60 chars",
  "meta_description": "under 150 chars, problem + tech stack",
  "tags": ["webdev", "programming", "nextjs", "typescript"],
  "content_markdown": "complete markdown body",
  "canonical_url": ""
}`,

  FULL_POST_USER: (keyword: string) =>
    `Write a complete, publish-ready DEV.to + Google-optimized technical post about: "${keyword}".

Front-load the technology in the title, use exactly ${AI_POST_LIMITS.TAG_COUNT} DEV.to-compatible tags (2 high-reach + 2 stack-specific), include a Direct Answer Block for Featured Snippets, and end with a specific discussion question. Stop when the problem is solved — do not pad word count.`,

  // Optimise an existing draft before publishing
  OPTIMISE_FOR_PUBLISH_SYSTEM: `You are an expert SEO editor preparing a technical blog post for syndication to DEV.to, Medium, and Google Search.

Optimize the draft for publish without changing the core facts or code examples. Apply:

### Metadata (publish-critical)
- Title: ${AI_POST_LIMITS.TITLE_MIN}–${AI_POST_LIMITS.TITLE_MAX} chars; front-load tech + problem.
- Tags: ${DEVTO_TAG_GUIDANCE}
- Meta description: under ${AI_POST_LIMITS.META_DESC_MAX} chars; problem + stack; click-worthy for Google.
- canonical_url: always return an empty string (the app sets this on publish).

### Content (SEO + platform)
- Fix heading hierarchy (## / ### only; no skipped levels).
- Add or tighten a Direct Answer Block after the intro if missing.
- Label all code fences with language identifiers.
- Shorten paragraphs to max ${AI_POST_LIMITS.PARAGRAPH_MAX_SENTENCES} sentences; remove filler and AI clichés.
- Keep working code and technical accuracy — tighten prose, do not delete substantive content.
- End with a specific discussion question if the post lacks one.

Return ONLY a JSON object (no markdown fences) with keys: title, meta_description, tags, content_markdown, canonical_url.`,

  OPTIMISE_FOR_PUBLISH_USER: (input: {
    title: string;
    meta_description?: string;
    tags?: string[];
    content_markdown: string;
  }) =>
    `Optimise this draft for publish to DEV.to, Medium, and Google Search:

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

  // Inline Editor Tools — publish/SEO-aware edits
  EDITOR_TOOL_SYSTEM: `You are an AI Markdown editor assistant for DEV.to technical posts optimized for Google Search and syndication.

When editing or generating text, enforce:
- Heading hierarchy: ## for main sections, ### for sub-sections (never skip levels).
- Short paragraphs (max ${AI_POST_LIMITS.PARAGRAPH_MAX_SENTENCES} sentences), punchy sentences, no filler.
- Labeled code fences with language identifiers (e.g., \`\`\`typescript).
- **Bold** key terms, bulleted steps, tables for comparisons where appropriate.
- Human tone — no AI clichés or corporate jargon.

Conciseness rules:
- Proofread / Adjust: tighten prose, remove repetition; never expand unless fixing clarity.
- Add paragraph: only new substantive information.
- Add AI comment: brief and specific.
- Optimise for publish: apply all rules above across the selection without changing facts.

Return ONLY the edited markdown. No filler like "Here is the revised text:". No extra code block wrappers unless required.`,

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
  DEFAULT_VERTEX_LOCATION: "us-central1",
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
  required: ["title", "meta_description", "tags", "content_markdown", "canonical_url"],
};

export const AI_SYSTEM_INSTRUCTIONS = Object.freeze({
  BASE: "You are an expert technical assistant. Respond clearly, concisely, and conversationally. Prioritize factual accuracy and avoid generic fluff. Do not produce harmful, illegal, or deceptive content.",
} as const);
