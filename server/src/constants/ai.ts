/**
 * AI (Vertex AI) constants: prompts, config keys and safety settings for the AI service.
 * SEO Analyst → Drafter
 */
import { HarmBlockThreshold, HarmCategory, Type } from "@google/genai";

export const AI_PROMPTS = {
  // Single-pass Full Post Generator
  FULL_POST_SYSTEM: `You are an elite-level SEO content strategist and copywriter. Given a target topic, your task is to write a highly optimized, detailed, and comprehensive blog post in fluent and professional English. First, identify trending SEO keywords related to the topic. Then, naturally incorporate those keywords throughout the post. Ensure the post is well-structured with clear headings (##, ###), bullet points, and provides maximum quality and depth to outrank competitors.

You MUST output a valid JSON object matching this exact schema. Do not output markdown code blocks wrapping the JSON:
{
  "title": "A catchy, SEO-optimized title (between 30 and 60 characters)",
  "meta_description": "A concise summary of the post for SEO (between 120 and 160 characters)",
  "tags": ["array", "of", "relevant", "tags"],
  "content_markdown": "The full, highly detailed blog post in markdown format"
}`,

  FULL_POST_USER: (keyword: string) =>
    `Write a full, SEO-optimized blog post (in markdown) about this topic or keyword: "${keyword}".`,

  // Image from topic – short, vivid prompt for featured image generation
  IMAGE_FROM_TOPIC_SYSTEM: `You are a prompt engineer for a blog featured image generator in comic book style. Given a blog topic, output a single short image prompt (1-2 sentences, under 100 words). The image should be professional, modern, suitable for a blog header: relative, conceptual, or minimal. No text in the image. Output only the prompt, nothing else.`,

  IMAGE_FROM_TOPIC_USER: (topic: string, additionalPrompt?: string) =>
    `Create an image prompt for a blog featured image based on this topic:\n\n${topic.slice(0, 1500)}${
      additionalPrompt ? `\n\nAdditional instructions from the user:\n${additionalPrompt.slice(0, 500)}` : ""
    }`,

  // Inline Editor Tools (proofread, comment, add paragraph, adjust, etc.)
  EDITOR_TOOL_SYSTEM: `You are an AI Markdown editor assistant built into a rich text editor. Your job is to take the user's action and the selected context, and return ONLY the edited or generated markdown text. 
Do not include conversational filler (like "Here is the revised text:"). Do not wrap it in markdown block quotes or extra markdown code blocks unless the context dictates it. Return exactly what should be injected back into the editor.`,

  EDITOR_TOOL_USER: (action: string, context: string) =>
    `Perform this action: "${action}". 
Here is the selected or surrounding text context:
---
${context}
---
Output ONLY the resulting text.`,
};

export const AI_CONFIG = Object.freeze({
  ENV_GOOGLE_CLOUD_PROJECT: "GOOGLE_CLOUD_PROJECT",
  ENV_GOOGLE_CLOUD_LOCATION: "GOOGLE_CLOUD_LOCATION",
  ENV_GOOGLE_APPLICATION_CREDENTIALS: "GOOGLE_APPLICATION_CREDENTIALS",
  // Use a generally available Vertex Gemini model by default.
  DEFAULT_MODEL: "gemini-3.1-flash",
  MAX_OUTLINE_TOKENS: 1024,
  MAX_DRAFT_TOKENS: 16384,
  MAX_IMAGE_PROMPT_TOKENS: 1024,
  IMAGEN_MODEL: "imagen-3.0-generate-001",
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
      items: { type: Type.STRING } 
    },
    content_markdown: { type: Type.STRING },
  },
  required: ["title", "meta_description", "tags", "content_markdown"],
};

/**
 * System instructions per model role. Centralising here keeps aiService.ts clean
 * and makes it easy to iterate on behavioural guidelines without touching service logic.
 */
export const AI_SYSTEM_INSTRUCTIONS = Object.freeze({
  /** General-purpose base model used for internal helper calls. */
  BASE: "You are a helpful AI assistant. Respond clearly and concisely. Do not produce harmful, illegal, or deceptive content.",
} as const);
