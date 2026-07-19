/**
 * AI (Google AI Studio) constants: prompts, config keys and safety settings.
 */
import { HarmBlockThreshold, HarmCategory, Type } from "@google/genai";

/** DEV.to + Google ranking constraints referenced by prompts and downstream validation. */
export const AI_POST_LIMITS = Object.freeze({
  TITLE_MAX: 60,
  META_DESC_MAX: 150,
  /** DEV.to API allows max 4 tags per article. */
  TAG_COUNT: 4,
  COVER_WIDTH: 1000,
  COVER_HEIGHT: 420,
  /** Editorial guidance for the model; value density matters more than word count. */
  SOFT_WORD_GUIDANCE: "800-1200 words for a focused, high-value blog; never fluff or pad to hit a target.",
  /** LinkedIn native post length (characters, including spaces). */
  LINKEDIN_POST_MIN_CHARS: 400,
  LINKEDIN_POST_MAX_CHARS: 1300,
  LINKEDIN_READ_MORE_PREFIX: "Read more:",
} as const);

/** Curated Gemini models exposed to the client model picker. */
export const AI_CONTENT_MODELS = Object.freeze([
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (default)" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (fast)" },
  {
    id: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro Preview (paid quota; auto-falls back to 3.5 Flash)",
  },
] as const);

export type AiContentModelId = (typeof AI_CONTENT_MODELS)[number]["id"];

const ALLOWED_CONTENT_MODEL_IDS = new Set<string>(AI_CONTENT_MODELS.map((m) => m.id));

export function isAllowedContentModel(model: string): boolean {
  return ALLOWED_CONTENT_MODEL_IDS.has(model.trim());
}

const FULL_POST_SYSTEM_BODY = `### Tone & Humanization (CRITICAL)
- **Sound Human:** Write conversationally, as if explaining a concept to a respected colleague over coffee.
- **Avoid AI Clichés:** NEVER use phrases like "In today's fast-paced digital world," "Delve into," "Demystify," "Unleash the power of," "Buckle up," or "In conclusion." 
- **Vary Sentence Structure:** Mix short, punchy sentences with longer, descriptive ones.
- **Formatting:** Use short paragraphs (max 3 sentences). Use bold text for emphasis.

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
- A 900-word post with working code outranks a 2,000-word post filled with repetitive AI fluff.

OUTPUT RULES:
- Do NOT include YAML front matter in content_markdown — metadata goes in the JSON fields only.
- tags must be exactly ${AI_POST_LIMITS.TAG_COUNT} lowercase strings without #.
- content_markdown must be the complete, concise post body in Markdown only — no filler.
- canonical_url must be a slugified version of the title (e.g. 'how-to-optimize-react-apps'), not a full URL.
- When LinkedIn optimization is selected, also fill linkedin_post (short native LinkedIn text). When LinkedIn is not selected, omit linkedin_post or use "".
You MUST output a valid JSON object matching this exact schema. Do not output markdown code blocks wrapping the JSON:
{
  "title": "A highly clickable, curiosity-inducing, SEO-optimized title (30-60 characters)",
  "meta_description": "A punchy summary that drives CTR in search results (120-150 characters)",
  "tags": ["array", "of", "max", "4", "highly", "relevant", "tags"],
  "content_markdown": "The full, highly detailed, humanized blog post in markdown format",
  "canonical_url": "A slugified version of the title suitable for a URL (e.g., 'how-to-optimize-react-apps')",
  "linkedin_post": "Short LinkedIn-native summary with strategic emojis when LinkedIn is a target; otherwise empty string"
}`;

export const AI_PROMPTS = {
  // Base rules; platform blocks appended by buildFullPostSystemPrompt()
  FULL_POST_SYSTEM_BASE: `You are an expert technical writer, and SEO specialist, and engaging technical storyteller. Your task is to write a comprehensive, highly optimized blog post that ranks on Google and performs well on the user's selected publishing platforms.

${FULL_POST_SYSTEM_BODY}`,

  FULL_POST_USER: (keyword: string) =>
    `Write one high-quality technical article about: "${keyword}".
Follow the system rules and platform optimization blocks exactly.
Prefer actionable depth and working examples over length. No fluff, no SEO spam.`,

  // Image from topic – Optimized for high-CTR blog headers
  IMAGE_FROM_TOPIC_SYSTEM: `You are a prompt engineer specializing in high-CTR blog featured images of size ${AI_POST_LIMITS.COVER_WIDTH}×${AI_POST_LIMITS.COVER_HEIGHT}px. Given a blog topic, output a single short image prompt (1-2 sentences, under 80 words). The image should be visually striking, conceptual, modern, and highly relatable to the tech/developer community. Use a consistent, high-quality style (e.g., vibrant 3D illustration, cinematic minimalism, or modern flat vector art). Output ONLY the prompt.`,

  IMAGE_FROM_TOPIC_USER: (topic: string, additionalPrompt?: string) =>
    `Create a compelling image prompt for ${AI_POST_LIMITS.COVER_WIDTH}×${AI_POST_LIMITS.COVER_HEIGHT}px a blog featured image based on this topic:\n\n${topic.slice(0, 1500)}${
      additionalPrompt ? `\n\nSpecific user instructions to include:\n${additionalPrompt.slice(0, 500)}` : ""
    }`,

  // Inline Editor Tools (proofread, comment, add paragraph, adjust, etc.)
  EDITOR_TOOL_SYSTEM: `You are an expert AI Markdown editor assistant built into a rich text editor. Your job is to take the user's action and the selected context, and return ONLY the edited or generated markdown text. 
Maintain a conversational, humanized tone. Avoid robotic transitions or corporate jargon.
Do not include conversational filler (like "Here is the revised text:"). Do not wrap it in markdown block quotes or extra markdown code blocks unless the text itself requires it. Return exactly what should be injected back into the editor.`,

  EDITOR_TOOL_USER: (action: string, context: string) =>
    `Perform this editing action: "${action}". 
Here is the selected or surrounding text context:
---
${context}
---
Output ONLY the resulting markdown text.`,

  LINKEDIN_SUMMARY_SYSTEM: `You write short native LinkedIn posts for developers. Output ONLY the LinkedIn post text (plain text, no Markdown headings or code fences).
Rules:
- Hook in the first 2 lines (LinkedIn truncates with "see more").
- Short paragraphs (1–3 sentences). Length ~${AI_POST_LIMITS.LINKEDIN_POST_MIN_CHARS}–${AI_POST_LIMITS.LINKEDIN_POST_MAX_CHARS} characters.
- Use 3–8 relevant emojis for scannability (line openers, bullets, light CTA). Never spam.
- End with 3–5 relevant hashtags on their own line (e.g. #WebDev #JavaScript).
- Soft CTA is fine ("What's your take? 👇").
- Do NOT invent a domain. Do NOT include a "Read more:" URL — the server inserts it before the hashtags.
- Do NOT wrap the answer in quotes or code fences.`,

  LINKEDIN_SUMMARY_USER: (title: string, articleExcerpt: string) =>
    `Write a LinkedIn teaser for this article.

Title: ${title}

Article (excerpt):
---
${articleExcerpt}
---
Output ONLY the LinkedIn post text.`,

  TRENDING_TOPICS_SYSTEM: `You are a tech content and SEO strategist. Using current Google Search trends for developers and software engineering, propose blog topics AND primary Google search keywords.
Return ONLY valid JSON (no markdown fences):
{"topics":["topic 1","topic 2","topic 3","topic 4","topic 5","topic 6"],"keywords":["keyword 1","keyword 2","keyword 3","keyword 4","keyword 5","keyword 6","keyword 7","keyword 8"]}
Rules:
- Exactly 6 topics: short phrases (4–10 words), specific and timely (tools, frameworks, practices)
- Exactly 8 keywords: Google-search style primary keywords (2–5 words each), lowercase, high commercial/informational intent for ranking blog posts
- Keywords should match what someone would type into Google (e.g. "next.js app router", "react server components")
- No hashtags, no numbering, no quotes inside topics or keywords
- Prefer developer/SEO-friendly angles (tutorials, pitfalls, production tips)`,

  TRENDING_TOPICS_USER: `Search for what developers are researching and talking about right now (web, cloud, AI tooling, TypeScript/React/Next.js, databases, DevOps). Return 6 high-reach blog topic phrases and 8 Google SEO keywords as JSON.`,
};

export const AI_CONFIG = Object.freeze({
  ENV_GOOGLE_AI_MODEL: "GOOGLE_AI_MODEL",
  ENV_GEMINI_API_KEY: "GEMINI_API_KEY",
  /** Alternate env name supported by @google/genai SDK. */
  ENV_GOOGLE_API_KEY: "GOOGLE_API_KEY",
  GEMINI_API_KEY_URL: "https://aistudio.google.com/apikey",
  /** Default + primary fallback — Gemini 3.5 Flash on Google AI Studio. */
  DEFAULT_MODEL: "gemini-3.5-flash",
  /**
   * Tried in order when the selected model returns 429/503/404.
   * Always prefer gemini-3.5-flash first.
   */
  MODEL_FALLBACKS: ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"] as readonly string[],
  /**
   * Image model candidates (Studio). Imagen is often unavailable to new free keys;
   * Gemini native image may hit quota — SVG cover is last resort in generateImage.
   */
  IMAGE_MODEL_FALLBACKS: [
    "gemini-3-pro-image-preview",
    "imagen-4.0-generate-001",
    "imagen-4.0-fast-generate-001",
  ] as readonly string[],
  /**
   * Output token caps (maxOutputTokens). On Gemini 2.5+/3.x Flash, internal "thinking"
   * tokens count toward this budget — see FLASH_THINKING_BUDGET.
   */
  MAX_DRAFT_TOKENS: 8192,
  MAX_EDIT_TOKENS: 4096,
  /** LinkedIn teaser only — short plain text. */
  MAX_LINKEDIN_SUMMARY_TOKENS: 2048,
  MAX_IMAGE_PROMPT_TOKENS: 512,
  /** Trending topics + keywords: short JSON list. */
  MAX_TRENDING_TOPICS_TOKENS: 768,
  /** Cache live trending topics to limit Search grounding calls. */
  TRENDING_TOPICS_CACHE_MS: 15 * 60 * 1000,
  TRENDING_TOPICS_COUNT: 6,
  GOOGLE_KEYWORDS_COUNT: 8,
  /** Parsed topic phrase length bounds. */
  TOPIC_MIN_LEN: 8,
  TOPIC_MAX_LEN: 120,
  /** Parsed Google keyword length bounds. */
  KEYWORD_MIN_LEN: 3,
  KEYWORD_MAX_LEN: 60,
  /** Minimum items required after parse before accepting a live response. */
  TRENDING_PARSE_MIN_ITEMS: 3,
  /** Top popular DEV.to tags from /api/tags (ordered by reach). */
  DEVTO_REACH_TAGS_COUNT: 12,
  DEVTO_REACH_TAGS_MIN: 3,
  /** Cache DEV.to tags longer — popularity shifts slowly. */
  DEVTO_REACH_TAGS_CACHE_MS: 60 * 60 * 1000,
  DEVTO_API_USER_AGENT: "SyncApp/1.0",
  DEVTO_TAG_NAME_PATTERN: /^[a-z0-9][a-z0-9-]{0,29}$/,
  /** SVG cover fallback copy when image models are unavailable. */
  COVER_SVG_FALLBACK_TITLE: "Generated cover image",
  COVER_SVG_BADGE: "FEATURED COVER",
  /** Structured posts: enough creativity, stable JSON. */
  TEMPERATURE_POST: 0.55,
  /** Inline edits: stay close to source text. */
  TEMPERATURE_EDIT: 0.25,
  TOP_P: 0.95,
  /** 0 = disable Flash thinking so maxOutputTokens go to visible JSON/text, not reasoning. */
  FLASH_THINKING_BUDGET: 0,
  /** Legacy Imagen id (often 404 for new Studio keys). Prefer IMAGE_MODEL_FALLBACKS. */
  IMAGEN_MODEL: "imagen-4.0-generate-001",
  /** Keep low — retries × slow 503s previously exceeded the client AI timeout. */
  RETRY_ATTEMPTS: 2,
  RETRY_BASE_DELAY_MS: 400,
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
    linkedin_post: { type: Type.STRING },
  },
  required: ["title", "meta_description", "tags", "content_markdown", "canonical_url"],
};
