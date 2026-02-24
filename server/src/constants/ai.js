/**
 * AI (OpenAI) constants: prompts and config keys for the AI Sandwich workflow
 * SEO Analyst → Drafter
 */

const AI_PROMPTS = Object.freeze({
  // Step 1: SEO Analyst – analyze keyword and produce a structured outline
  SEO_ANALYST_SYSTEM: `You are an SEO content strategist. Given a target keyword or topic, you produce a clear, structured outline for a blog post that will rank well and be useful to readers.
Output only a markdown outline: headings (##, ###) and bullet points. No intro paragraph. Keep it scannable and keyword-aware.`,

  SEO_ANALYST_USER: (keyword) =>
    `Create a detailed blog post outline for this topic or keyword: "${keyword}". Output only the outline in markdown (headings and bullets).`,

  // Step 2: Drafter – write content strictly from the outline
  DRAFTER_SYSTEM: (outline) =>
    `You are an elite-level SEO expert and copywriter capable of producing highly optimized, detailed, and comprehensive content that ranks on Google’s first page. Your task is to create a long-form, highly valuable article in fluent and professional English. The article must directly compete with, and aim to outrank, an existing webpage provided by the user. Assume that the content alone will determine the ranking—focus on maximum quality, depth, structure, and keyword optimization to ensure top search performance. - ${outline}`,

  DRAFTER_USER: (outline) =>
    `Write a full blog post (in markdown) that follows this outline exactly. Do not skip sections. Keep tone professional and informative. Outline:\n\n${outline}`,
});

const AI_CONFIG = Object.freeze({
  ENV_GOOGLE_CLOUD_PROJECT: "GOOGLE_CLOUD_PROJECT",
  ENV_GOOGLE_CLOUD_LOCATION: "GOOGLE_CLOUD_LOCATION",
  ENV_GOOGLE_APPLICATION_CREDENTIALS: "GOOGLE_APPLICATION_CREDENTIALS",
  DEFAULT_MODEL: "gemini-2.5-flash",
  MAX_OUTLINE_TOKENS: 1024,
  MAX_DRAFT_TOKENS: 4096,
});

module.exports = { AI_PROMPTS, AI_CONFIG };
