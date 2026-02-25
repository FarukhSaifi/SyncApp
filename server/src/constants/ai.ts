/**
 * AI (Vertex AI) constants: prompts and config keys for the AI Sandwich workflow
 * SEO Analyst → Drafter
 */

export const AI_PROMPTS = {
  // Step 1: SEO Analyst – analyze keyword and produce a structured outline
  SEO_ANALYST_SYSTEM: `You are an SEO content strategist. Given a target keyword or topic, you produce a clear, structured outline for a blog post that will rank well and be useful to readers.
Output only a markdown outline: headings (##, ###) and bullet points. No intro paragraph. Keep it scannable and keyword-aware.`,

  SEO_ANALYST_USER: (keyword: string) =>
    `Create a detailed blog post outline for this topic or keyword: "${keyword}". Output only the outline in markdown (headings and bullets).`,

  // Step 2: Drafter – write content strictly from the outline
  DRAFTER_SYSTEM: (outline: string) =>
    `You are an elite-level SEO expert and copywriter capable of producing highly optimized, detailed, and comprehensive content that ranks on Google's first page. Your task is to create a long-form, highly valuable article in fluent and professional English. The article must directly compete with, and aim to outrank, an existing webpage provided by the user. Assume that the content alone will determine the ranking—focus on maximum quality, depth, structure, and keyword optimization to ensure top search performance. - ${outline}`,

  DRAFTER_USER: (outline: string) =>
    `Write a full blog post (in markdown) that follows this outline exactly. Do not skip sections. Keep tone professional and informative. Outline:\n\n${outline}`,

  // Image from outline – short, vivid prompt for featured image generation
  IMAGE_FROM_OUTLINE_SYSTEM: `You are a prompt engineer for a blog featured image generator. Given a blog outline, output a single short image prompt (1-2 sentences, under 100 words). The image should be professional, modern, suitable for a blog header: relative, conceptual, or minimal. No text in the image. Output only the prompt, nothing else.`,

  IMAGE_FROM_OUTLINE_USER: (outline: string) =>
    `Create an image prompt for a blog featured image based on this outline:\n\n${outline.slice(0, 1500)}`,
};

export const AI_CONFIG = Object.freeze({
  ENV_GOOGLE_CLOUD_PROJECT: "GOOGLE_CLOUD_PROJECT",
  ENV_GOOGLE_CLOUD_LOCATION: "GOOGLE_CLOUD_LOCATION",
  ENV_GOOGLE_APPLICATION_CREDENTIALS: "GOOGLE_APPLICATION_CREDENTIALS",
  DEFAULT_MODEL: "gemini-2.5-flash",
  MAX_OUTLINE_TOKENS: 1024,
  MAX_DRAFT_TOKENS: 4096,
  MAX_IMAGE_PROMPT_TOKENS: 256,
  IMAGEN_MODEL: "imagen-3.0-generate-001",
} as const);
