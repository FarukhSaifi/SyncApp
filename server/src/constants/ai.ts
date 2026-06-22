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

export const AI_PROMPTS = {
  // Single-pass Full Post Generator
  FULL_POST_SYSTEM: `You are an expert technical writer, and SEO specialist, and engaging technical storyteller. Your task is to write a comprehensive, highly optimized blog post that ranks #1 on Google and goes viral on DEV.to and Medium.

### Tone & Humanization (CRITICAL)
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
}`,

  FULL_POST_USER: (keyword: string) =>
    `You are an elite-level SEO expert and copywriter capable of producing highly optimized, detailed, and comprehensive content that ranks on Google’s first page. Your task is to create a long-form, highly valuable article in fluent and professional English. The article must directly compete with, and aim to outrank, an existing webpage provided by the user. Assume that the content alone will determine the ranking—focus on maximum quality, depth, structure, and keyword optimization to ensure top search performance. The article must be about: "${keyword}".`,

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
  ENV_GOOGLE_CLOUD_PROJECT: "GOOGLE_CLOUD_PROJECT",
  ENV_GOOGLE_CLOUD_LOCATION: "GOOGLE_CLOUD_LOCATION",
  ENV_GOOGLE_APPLICATION_CREDENTIALS: "GOOGLE_APPLICATION_CREDENTIALS",
  ENV_GOOGLE_AI_MODEL: "GOOGLE_AI_MODEL",
  /** Default model — Vertex AI usage-based free tier (~1,000 requests/day, rate-limited). */
  DEFAULT_MODEL: "gemini-3.5-flash",
  /** Documented Vertex AI free-tier daily request cap. */
  VERTEX_FREE_TIER_DAILY_REQUESTS: 1000,
  /** Gemini global endpoint fallbacks. */
  VERTEX_GLOBAL_MODEL_PREFIXES: ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite"] as readonly string[],
  DEFAULT_VERTEX_LOCATION: "us-central1",
  VERTEX_GLOBAL_FALLBACK_LOCATION: "global",
  MAX_OUTLINE_TOKENS: 1024,
  MAX_DRAFT_TOKENS: 16384,
  MAX_IMAGE_PROMPT_TOKENS: 1024,
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

/**
 * System instructions per model role. Centralizing here keeps aiService.ts clean
 * and makes it easy to iterate on behavioral guidelines without touching service logic.
 */
export const AI_SYSTEM_INSTRUCTIONS = Object.freeze({
  /** General-purpose base model used for internal helper calls. */
  BASE: "You are an expert technical assistant. Respond clearly, concisely, and conversationally. Prioritize factual accuracy and avoid generic fluff. Do not produce harmful, illegal, or deceptive content.",
} as const);
