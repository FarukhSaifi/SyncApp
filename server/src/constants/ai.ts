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
} as const);

/** Curated Gemini models exposed to the client model picker. */
export const AI_CONTENT_MODELS = Object.freeze([
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (default, fast)" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (higher quality)" },
  {
    id: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro Preview (paid quota; auto-falls back to Flash Lite)",
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
You MUST output a valid JSON object matching this exact schema. Do not output markdown code blocks wrapping the JSON:
{
  "title": "A highly clickable, curiosity-inducing, SEO-optimized title (30-60 characters)",
  "meta_description": "A punchy summary that drives CTR in search results (120-150 characters)",
  "tags": ["array", "of", "max", "4", "highly", "relevant", "tags"],
  "content_markdown": "The full, highly detailed, humanized blog post in markdown format",
  "canonical_url": "A slugified version of the title suitable for a URL (e.g., 'how-to-optimize-react-apps')"
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
};

export const AI_CONFIG = Object.freeze({
  ENV_GOOGLE_AI_MODEL: "GOOGLE_AI_MODEL",
  ENV_GEMINI_API_KEY: "GEMINI_API_KEY",
  /** Alternate env name supported by @google/genai SDK. */
  ENV_GOOGLE_API_KEY: "GOOGLE_API_KEY",
  GEMINI_API_KEY_URL: "https://aistudio.google.com/apikey",
  /** Prefer flash-lite — 3.5 Flash often returns 503 under Studio free-tier demand. */
  DEFAULT_MODEL: "gemini-3.1-flash-lite",
  /**
   * Tried in order when the selected model returns 429/503 (quota or overload).
   * Pro models on free tier almost always need this path.
   */
  MODEL_FALLBACKS: ["gemini-3.1-flash-lite", "gemini-flash-lite-latest", "gemini-3.5-flash"] as readonly string[],
  /**
   * Image model candidates (Studio). Imagen is often unavailable to new free keys;
   * Gemini native image may hit quota — SVG cover is last resort in generateImage.
   */
  IMAGE_MODEL_FALLBACKS: [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image",
    "imagen-4.0-generate-001",
  ] as readonly string[],
  /**
   * Output token caps (maxOutputTokens). On Gemini 2.5+/3.x Flash, internal "thinking"
   * tokens count toward this budget — see FLASH_THINKING_BUDGET.
   */
  MAX_DRAFT_TOKENS: 8192,
  MAX_EDIT_TOKENS: 4096,
  MAX_IMAGE_PROMPT_TOKENS: 512,
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
  },
  required: ["title", "meta_description", "tags", "content_markdown", "canonical_url"],
};
