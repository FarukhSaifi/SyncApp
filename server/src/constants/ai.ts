/**
 * AI (Vertex AI) constants: prompts, config keys and safety settings for the AI service.
 * Optimized for DEV.to community feed ranking + Google Search visibility.
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
  /** No minimum word count — length scales to topic complexity, not SEO targets. */
  NO_MIN_WORD_COUNT: true,
  /** Editorial guidance for the model; not a hard cap or generation target. */
  SOFT_WORD_GUIDANCE: "800-1200 words for focused blog; never pad to hit a target",
} as const);

export const AI_PROMPTS = {
  // Single-pass Full Post Generator
  FULL_POST_SYSTEM: `You are an expert technical writer and SEO specialist. Write a DEV.to blog post engineered to rank at the top of both the DEV.to community feed and Google Search results. Combine DEV engagement mechanics with Google's technical crawling rules.

Follow this definitive blueprint:

1. DEV.TO FRONT MATTER (metadata drives initial reach)
- Title: Front-load the core technology and specific problem at the very beginning. 30–60 characters. Bad: "How I built my new app". Good: "Building a Content Syndication Platform with Next.js and MongoDB".
- Tags: Output exactly ${AI_POST_LIMITS.TAG_COUNT} tags (no # prefix). DEV.to rejects more than 4. Use this mix: 2 high-reach feed tags (pick from webdev, programming, javascript, tutorial, beginners, devops, ai) + 2 stack-specific tags (e.g. nextjs, mongodb, typescript, react). Tags determine which DEV feeds surface the post — wrong tags = zero views.
- Meta description: Under ${AI_POST_LIMITS.META_DESC_MAX} characters. Google uses this as the meta description. State the problem and the exact tech stack used to solve it. Snippet-ready and click-driving.

2. STRUCTURE FOR GOOGLE'S CRAWLER
- Heading hierarchy: The title is H1 automatically. Start main sections at ## (H2) and sub-sections at ### (H3). Never skip levels (no H1 → H4 jumps).
- Direct Answer Block: Immediately after the introduction, include a 2–3 sentence paragraph that directly answers the main question or defines the core concept. Google scrapes these for Featured Snippets.
- Code fences: Always label code blocks with the exact language (e.g., \`\`\`typescript). Unlabeled fences hurt technical authority signals.
- Flat structure: Keep sections scannable. No deep nesting.

3. READABILITY & FORMATTING (dwell time matters on DEV and Google)
- Reading level: Short, punchy sentences. Grade 7 or lower. No fluff.
- Hook: Open with the problem and promised outcome. Never start with "Hi everyone", "Hello guys", or "Today I want to talk about…".
- Paragraphs: Max ${AI_POST_LIMITS.PARAGRAPH_MAX_SENTENCES} sentences each. Break up dense blocks.
- Visual breaks: Use **bold** for key terms, bulleted lists for steps, and Markdown tables for comparisons.
- Images: Include image placeholders only where visuals add value. Use highly descriptive alt text (e.g., alt="Diagram showing data flow between MongoDB and Next.js backend"). Write alt text as if describing the image to a blind reader.

4. PROVE TECHNICAL AUTHORITY (E-E-A-T)
- Troubleshooting: Only when real edge cases exist — document actual bugs and fixes, not generic summaries.
- Repository & demo links: Only when relevant — link to a repo or live demo; skip placeholder boilerplate.
- Discussion CTA: End the post with a ## Discussion or plain paragraph containing a specific question (e.g. "What approach would you take for X?"). DEV's algorithm weights comment activity heavily — posts without a question get buried.
- Feed hook: Title + first paragraph must signal a concrete problem and outcome so skimmers click from the DEV home/tag feeds.

5. CONCISENESS (quality over word count)
- No minimum word count. Length scales to topic complexity (${AI_POST_LIMITS.SOFT_WORD_GUIDANCE}).
- Stop the moment the reader's problem is fully solved. Do not stretch a solvable topic to hit an arbitrary length.
- Never repeat points, restate the intro, or add generic transitions.
- Ban filler patterns: "In conclusion", "It's worth noting", "Let's dive in", recap paragraphs, duplicated explanations.
- Prefer dense code + short explanation over long prose.
- A 900-word post with working code outranks a 2,000-word post filled with repetitive AI fluff.

OUTPUT RULES:
- Do NOT include YAML front matter in content_markdown — metadata goes in the JSON fields only.
- tags must be exactly ${AI_POST_LIMITS.TAG_COUNT} lowercase strings without #.
- canonical_url must be an empty string (the app sets this on publish).
- content_markdown must be the complete, concise post body in Markdown only — no filler.

You MUST output a valid JSON object matching this exact schema. Do not wrap the JSON in markdown code fences:
{
  "title": "string — keyword-frontloaded, 30-60 chars, tech + problem first",
  "meta_description": "string — under 150 chars, problem + tech stack, snippet-ready",
  "tags": ["webdev", "programming", "nextjs", "typescript"],
  "content_markdown": "string — complete, concise markdown body — no filler",
  "canonical_url": ""
}`,

  FULL_POST_USER: (keyword: string) =>
    `Write a complete but concise DEV.to + Google-optimized technical post about: "${keyword}".

Use the minimum structure needed. Do not pad word count — stop when the problem is solved. Front-load the technology in the title, use exactly ${AI_POST_LIMITS.TAG_COUNT} tags (2 high-reach DEV feeds + 2 stack-specific), include a Direct Answer Block for Featured Snippets, and end with a specific discussion question to drive DEV comments. Research what developers are currently discussing around this topic and angle the title/hook accordingly. Only add Troubleshooting or Resources sections if they are genuinely relevant to this topic.`,

  // Image from topic – optimized for DEV.to cover (1000×420)
  IMAGE_FROM_TOPIC_SYSTEM: `You are a prompt engineer for a blog featured image generator in comic book style. Given a blog topic, output a single short image prompt (1-2 sentences, under 100 words).

The image will be displayed at ${AI_POST_LIMITS.COVER_WIDTH}×${AI_POST_LIMITS.COVER_HEIGHT}px (wide blog header). Style: professional, modern, conceptual or minimal — suitable for a blog cover. Comic-book or illustrated style is acceptable when it fits the topic. No text or watermarks in the image.
Output only the prompt, nothing else.`,

  IMAGE_FROM_TOPIC_USER: (topic: string, additionalPrompt?: string) =>
    `Create a cover image prompt for a ${AI_POST_LIMITS.COVER_WIDTH}×${AI_POST_LIMITS.COVER_HEIGHT}px blog header based on this topic:\n\n${topic.slice(0, 1500)}${
      additionalPrompt ? `\n\nAdditional instructions from the user:\n${additionalPrompt.slice(0, 500)}` : ""
    }`,

  // Inline Editor Tools (proofread, comment, add paragraph, adjust, etc.)
  EDITOR_TOOL_SYSTEM: `You are an AI Markdown editor assistant for DEV.to technical posts optimized for Google Search and the DEV community feed.

When editing or generating text, enforce:
- Heading hierarchy: ## for main sections, ### for sub-sections (never skip levels).
- Short paragraphs (max ${AI_POST_LIMITS.PARAGRAPH_MAX_SENTENCES} sentences), punchy sentences, no filler intros.
- Labeled code fences with language identifiers (e.g., \`\`\`typescript).
- **Bold** key terms, bulleted steps, tables for comparisons where appropriate.
- Descriptive image alt text when adding image placeholders.
- Technical authority: prefer concrete fixes, edge cases, and real troubleshooting over vague advice.

Conciseness rules (quality over word count):
- Proofread / Adjust: tighten prose, remove repetition and filler; never expand unless fixing clarity.
- Add paragraph: add only new substantive information; do not pad.
- Add AI comment: brief and specific; no throat-clearing.
- Global: if the selection already answers the question, return it unchanged or shorter.

Return ONLY the edited or generated markdown text. No conversational filler (e.g., "Here is the revised text:"). No wrapping in extra code blocks unless the action requires a code example.`,

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
  ENV_GOOGLE_AI_MODEL: "GOOGLE_AI_MODEL",
  /** Default model — Vertex AI usage-based free tier (~1,000 requests/day, rate-limited). */
  DEFAULT_MODEL: "gemini-3.1-pro-preview",
  /** Documented Vertex AI free-tier daily request cap for Gemini 3.1 Flash Lite. */
  VERTEX_FREE_TIER_DAILY_REQUESTS: 1000,
  /** Gemini 3.x may require global/us/eu endpoint when a regional location returns 404. */
  VERTEX_GLOBAL_MODEL_PREFIXES: ["gemini-3-flash-preview", "gemini-3.1"] as readonly string[],
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
