/**
 * AI (Vertex AI primary / Google AI Studio fallback) constants: prompts, config, safety.
 */
import { HarmBlockThreshold, HarmCategory, Type } from "@google/genai";

/** DEV.to + Google ranking constraints referenced by prompts and downstream validation. */
export const AI_POST_LIMITS = Object.freeze({
  TITLE_MAX: 60,
  META_DESC_MAX: 150,
  /**
   * Default article tag count (DEV.to hard max). Prefer PLATFORM_TAG_LIMITS +
   * resolveArticleTagLimit() when targets are known.
   */
  TAG_COUNT: 4,
  /** LinkedIn hashtag sweet spot upper bound (3–5; use 5 for best reach). */
  LINKEDIN_HASHTAG_COUNT: 5,
  LINKEDIN_HASHTAG_MIN: 3,
  LINKEDIN_HASHTAG_MAX: 5,
  COVER_WIDTH: 1000,
  COVER_HEIGHT: 420,
  /** Editorial guidance for the model; value density matters more than word count. */
  SOFT_WORD_GUIDANCE: "800-1200 words for a focused, high-value blog; never fluff or pad to hit a target.",
  /** LinkedIn native post length (characters, including spaces). */
  LINKEDIN_POST_MIN_CHARS: 400,
  LINKEDIN_POST_MAX_CHARS: 1300,
  LINKEDIN_READ_MORE_PREFIX: "Read more:",
  /** Minimum plain-text context length before LinkedIn summary generation. */
  LINKEDIN_SUMMARY_CONTEXT_MIN_CHARS: 20,
  /** Fallback display title length when post title is empty. */
  LINKEDIN_FALLBACK_TITLE_MAX_CHARS: 80,
  /** Fallback LinkedIn body when the model omits linkedin_post. */
  LINKEDIN_FALLBACK_META:
    "Check out this in-depth guide covering key takeaways, architecture, and practical implementations.",
  LINKEDIN_FALLBACK_CTA: "Read more below 👇",
} as const);

/** Curated Gemini models exposed to the client model picker. */
export const AI_CONTENT_MODELS = Object.freeze([
  {
    id: "gemini-3.5-flash-lite",
    label: "3.5 Flash-Lite",
    description: "Fastest answers",
  },
  {
    id: "gemini-3.8-flash",
    label: "3.8 Flash",
    description: "All-around help",
  },
  {
    id: "gemini-3.1-pro-preview",
    label: "3.1 Pro",
    description: "Advanced reasoning",
  },
] as const);

export type AiContentModelId = (typeof AI_CONTENT_MODELS)[number]["id"];

const ALLOWED_CONTENT_MODEL_IDS = new Set<string>(AI_CONTENT_MODELS.map((m) => m.id));

export function isAllowedContentModel(model: string): boolean {
  return ALLOWED_CONTENT_MODEL_IDS.has(model.trim());
}

const FULL_POST_SYSTEM_BODY = `### Tone & Humanization (CRITICAL — anti AI-detection)
- **Sound human:** Write like a senior engineer explaining to a peer — conversational, opinionated where useful, never corporate-brochure tone.
- **Vary sentence rhythm:** Mix short punchy lines with longer explanatory ones. Do not produce a steady march of same-length sentences.
- **Vary paragraph length:** Alternate 1-sentence beats with 2–4 sentence paragraphs. Uniform "three neat sentences every time" reads as generated.
- **Personal-touch phrasing:** Use light first-person or lived-experience cues when natural ("I've seen this bite teams in production", "Here's the pattern that stuck for us"). Do not invent fake credentials or employers.
- **Natural transitions:** Connect ideas with specific bridges ("That works until traffic spikes", "The catch shows up in the edge case below") — not stock glue ("Furthermore", "Moreover", "In addition", "Additionally").
- **Concrete examples:** Prefer named tools, versions, error messages, file paths, or short realistic snippets over abstract advice. One real example beats three generic claims.
- **Lists sparingly:** Use bullets/numbers only when the reader truly needs a checklist or ordered steps. Do not turn every section into a list. Prefer prose + one code block when that is clearer.
- **Avoid AI clichés:** NEVER use "In today's fast-paced digital world", "Delve into", "Demystify", "Unleash the power of", "Buckle up", "In conclusion", "It's worth noting", "Let's dive in", "At the end of the day", "In this article, we will explore", or similar filler openers/closers.
- **Formatting:** Bold sparingly for genuine emphasis. No emoji walls in the article body.

### Anti-spam & search quality (CRITICAL)
- **No keyword stuffing:** Mentions of the primary topic and LSI terms must read like natural speech. Never repeat the same phrase in every heading, opening sentence, or meta fields.
- **Natural keyword density:** Place the main topic clearly in the title, intro, and where it earns its keep — not in every paragraph for rank chasing.
- **No hidden / deceptive text:** No invisible HTML, white-on-white text, zero-size spans, cloaking, or content meant only for crawlers.
- **No doorway-page patterns:** Do not write thin pages that only exist to funnel searches to another URL. Deliver a complete answer on this page; use one honest canonical slug, not a swarm of near-duplicate angles.
- **No spammy CTAs:** Avoid aggressive affiliate-style pitches, fake urgency, or link-farm language. Soft, relevant next steps only.
- **Honest meta:** title and meta_description must accurately describe the article — no bait-and-switch.

### SEO & Platform Optimization (E-E-A-T + Information Gain)
- **Search Intent:** Answer the reader's real question early. Prefer actionable, practical advice over theory dumps.
- **Beat generic AI content:** Google penalizes interchangeable summaries. Every draft must add *information gain* — specifics a templated AI overview would miss (versions, failure modes, measured numbers, real commands).
- **High-intent long-tail keywords:** Target phrases a practitioner would type when solving a job (e.g. "How to stream Gemini AI responses in Next.js App Router with Vercel timeouts"), not broad head terms like "What is React". Title + intro must mirror that long-tail intent without stuffing.
- **Featured snippet box (40-word rule):** Immediately under the **first primary H2** (\`## …\`), place a concise factual answer of **2–3 sentences / 35–50 words** that directly answers the search query. Google often lifts this into position zero. Do not bury the answer in a long preamble.
- **Real implementation artifacts (required):** Include working code fences (copy-pasteable), terminal commands, concrete benchmark or timing notes when relevant, and at least one mermaid or ASCII system/flow diagram when the topic involves architecture. Generic prose without artifacts ranks poorly.
- **Structure:** Open with a concrete hook (problem, surprising fact, or sharp claim). Use a clear ## / ### hierarchy that mirrors how a human would outline the topic.
- **Rich Elements:** Use Markdown where it helps — > blockquotes for one sharp callout, code fences for working examples. Lists only when scannability genuinely improves understanding.

CONCISENESS (quality over word count)
- No minimum word count. Length scales to topic complexity (${AI_POST_LIMITS.SOFT_WORD_GUIDANCE}).
- Stop the moment the reader's problem is fully solved. Do not stretch a solvable topic to hit an arbitrary length.
- Never repeat points, restate the intro, or pad with generic transitions.
- Ban filler patterns and recap paragraphs / duplicated explanations.
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
  FULL_POST_SYSTEM_BASE: `You are an expert technical blog writer, SEO specialist, and engaging technical storyteller. Your task is to write a comprehensive, highly optimized blog post that ranks on Google and performs well on the user's selected publishing platforms.

${FULL_POST_SYSTEM_BODY}`,

  FULL_POST_USER: (keyword: string) =>
    `Write one high-quality technical article about: "${keyword}".
Follow the system rules and platform optimization blocks exactly.
Treat "${keyword}" as a high-intent long-tail search query — optimize title, H2s, and the 35–50 word snippet answer under the first H2 for that query.
Prefer actionable depth, working code, commands, and diagrams over length.
Sound naturally human (varied rhythm, personal touch, no AI clichés). No fluff, no keyword stuffing, no spam patterns.`,

  // Image from topic – Optimized for high-CTR blog headers
  IMAGE_FROM_TOPIC_SYSTEM: `You are a prompt engineer specializing in high-CTR blog featured images generator in comic book style of size ${AI_POST_LIMITS.COVER_WIDTH}×${AI_POST_LIMITS.COVER_HEIGHT}px. Given a blog topic, output a single short image prompt (1-2 sentences, under 80 words). The image should be visually striking, conceptual, modern, and highly relatable to the tech/developer community. Use a consistent, high-quality style (e.g., vibrant 3D illustration, cinematic minimalism, or modern flat vector art). Output ONLY the prompt.`,

  IMAGE_FROM_TOPIC_USER: (topic: string, additionalPrompt?: string) =>
    `Create a compelling image prompt for ${AI_POST_LIMITS.COVER_WIDTH}×${AI_POST_LIMITS.COVER_HEIGHT}px a blog featured image based on this topic:\n\n${topic.slice(0, 1500)}${
      additionalPrompt ? `\n\nSpecific user instructions to include:\n${additionalPrompt.slice(0, 500)}` : ""
    }`,

  // Inline Editor Tools (proofread, comment, add paragraph, adjust, etc.)
  EDITOR_TOOL_SYSTEM: `You are an expert AI Markdown editor assistant built into a rich text editor. Your job is to take the user's action and the selected context, and return ONLY the edited or generated markdown text.
Maintain a conversational, humanized tone: vary sentence rhythm, prefer concrete wording, and avoid robotic transitions or corporate jargon.
Do not introduce AI clichés ("In conclusion", "Let's dive in", "It's worth noting"), keyword stuffing, or spammy CTA language.
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

  TRENDING_TOPICS_SYSTEM: (liveSearchContext: string) =>
    `You are an elite developer trends researcher and SEO strategist.
${liveSearchContext}Using Google Search grounding and current developer search behavior, identify the top 6 high-intent long-tail blog topics and top 8 Google search keywords right now — phrases that beat generic AI content via information gain (code, constraints, versions).
Return ONLY valid JSON matching this schema:
{
  "topics": ["6 long-tail practitioner topics (6-14 words; stack + constraint; NOT broad like what is react)"],
  "keywords": ["8 high-intent Google search keywords developers type now (3-8 words each, lowercase)"]
}
Rules:
- Prefer high-intent long-tail over broad head terms.
- Be timely, relevant, and specific in Tech.
- No markdown wrappers outside the JSON, return ONLY valid JSON.`,

  TRENDING_TOPICS_USER: `Search for what developers, software engineers, and tech bloggers are actively searching for and discussing on Google right now. Return 6 high-reach blog topics and 8 Google SEO keywords as JSON.`,

  KEYWORD_RESEARCH_SYSTEM: `You are an elite SEO keyword researcher for technical content marketers.
Using Google Search grounding and autocomplete evidence, expand a broad seed topic into high-commercial-intent, low-competition long-tail keywords that can monetize via comparisons, tool picks, affiliate-friendly reviews, or buyer-guide content.
Return ONLY valid JSON (no markdown fences):
{"keywords":[{"keyword":"long-tail phrase","commercialIntent":0,"competition":0,"opportunityScore":0,"intentLabel":"transactional|commercial|informational","monetizationAngle":"short angle","rationale":"one short sentence"}]}
Rules:
- Exactly 10 keywords, ranked best opportunity first
- Prefer long-tail (3+ words), lowercase Google-style queries
- Prefer transactional/commercial intent over pure informational
- competition is estimated SERP difficulty 0–100 (lower = easier to rank)
- commercialIntent is buyer intent 0–100
- opportunityScore must favor high commercialIntent × low competition (0–100)
- Scores are AI estimates from Search grounding — NOT measured search volume or keyword difficulty tools
- Exclude branded mega-head terms and pure navigational queries (login, official docs home)
- monetizationAngle: concrete angle (e.g. "compare X vs Y for startups", "best tools for …", "pricing pitfalls")
- No hashtags, no numbering inside keyword strings`,

  KEYWORD_RESEARCH_USER: (seed: string, autocompleteContext: string) =>
    `Seed topic: "${seed}"
${autocompleteContext}
Search Google for related long-tail queries with high commercial intent and relatively low competition. Return exactly 10 scored keywords as JSON.`,

  /** Appended to full-post system when researchContext is present. */
  MONETIZATION_RESEARCH_SYSTEM: (monetizationAngle: string, intentLabel: string) =>
    `### Monetization research context
- Search intent label: ${intentLabel}
- Monetization angle: ${monetizationAngle}
- Optimize the draft for that angle: clear buyer criteria, honest comparisons, decision frameworks, and soft CTAs.
- Stay E-E-A-T compliant: no keyword stuffing, no fake urgency, no spammy affiliate language.
- Keep technical depth and working examples; monetization should feel editorial, not salesy.`,
};

export const AI_SEED_TOPIC_CATEGORIES = Object.freeze([
  ["ai agents software engineering", "generative ai developer tools", "model context protocol"],
  ["react 19 patterns", "nextjs app router architecture", "typescript performance optimization"],
  ["cloud native platform engineering", "kubernetes devops trends", "zero trust devsecops"],
  ["microservices system design", "database performance tuning", "rust backend development"],
  ["developer productivity tools", "open source github trending", "software architecture patterns"],
] as const);

/** Active AI backend labels returned by capabilities / health. */
export const AI_PROVIDERS = Object.freeze({
  VERTEX: "vertex",
  STUDIO: "studio",
  NONE: "none",
} as const);

/** Image generation source labels in API responses. */
export const AI_IMAGE_SOURCES = Object.freeze({
  GEMINI: "gemini",
  /** Retained for older clients; SyncApp no longer produces Imagen results. */
  IMAGEN: "imagen",
} as const);

/** Suggestion / research provenance ids (keep aligned with client AI_SUGGESTION_SOURCES). */
export const AI_SUGGESTION_SOURCES = Object.freeze({
  GOOGLE_SEARCH: "google_search",
} as const);

export const AI_CONFIG = Object.freeze({
  ENV_GOOGLE_AI_MODEL: "GOOGLE_AI_MODEL",
  ENV_GEMINI_API_KEY: "GEMINI_API_KEY",
  /** Alternate env name supported by @google/genai SDK. */
  ENV_GOOGLE_API_KEY: "GOOGLE_API_KEY",
  ENV_GOOGLE_CLOUD_PROJECT: "GOOGLE_CLOUD_PROJECT",
  ENV_GOOGLE_CLOUD_LOCATION: "GOOGLE_CLOUD_LOCATION",
  ENV_GOOGLE_CREDENTIALS_JSON: "GOOGLE_CREDENTIALS_JSON",
  ENV_GOOGLE_APPLICATION_CREDENTIALS: "GOOGLE_APPLICATION_CREDENTIALS",
  ENV_GCS_BUCKET_NAME: "GCS_BUCKET_NAME",
  ENV_GOOGLE_CLOUD_BUCKET: "GOOGLE_CLOUD_BUCKET",
  /**
   * Optional override for the SA used to sign V4 upload URLs when ADC is
   * `authorized_user` (no private_key). Defaults to VERTEX_SA_EMAIL.
   */
  ENV_GCS_SIGNING_SERVICE_ACCOUNT: "GCS_SIGNING_SERVICE_ACCOUNT",
  /** Scope required for GCS + IAM Credentials signBlob / impersonation. */
  GCS_CLOUD_PLATFORM_SCOPE: "https://www.googleapis.com/auth/cloud-platform",
  /** Impersonated access-token lifetime (seconds) for ADC → SA signing. */
  GCS_IMPERSONATION_LIFETIME_SEC: 3600,
  /** Default GCP project for Vertex AI + GCS. */
  DEFAULT_PROJECT: "syncapp-ai",
  /**
   * Vertex AI location. Gemini 3.x publisher models are available on `global`;
   * older Flash (e.g. gemini-2.5-flash) also works on `us-central1`.
   */
  DEFAULT_LOCATION: "global",
  /** Regional fallback location for models not published on `global`. */
  REGIONAL_LOCATION: "us-central1",
  /**
   * Default GCS bucket for cover uploads when `GCS_BUCKET_NAME` is unset.
   * Created in project `syncapp-ai` (us-central1). Prefer setting `GCS_BUCKET_NAME` explicitly.
   */
  DEFAULT_GCS_BUCKET_NAME: "syncapp-ai-covers",
  /** Legacy Firebase Storage default-bucket suffix (only if that bucket was provisioned). */
  GCS_BUCKET_SUFFIX: ".firebasestorage.app",
  GEMINI_API_KEY_URL: "https://aistudio.google.com/apikey",
  VERTEX_AI_CONSOLE_URL: "https://console.cloud.google.com/vertex-ai?project=syncapp-ai",
  VERTEX_AI_API_ENABLE_URL:
    "https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com&project=syncapp-ai",
  /** Org policy that blocks downloading SA JSON keys (common on Google Workspace orgs). */
  ORG_POLICY_DISABLE_SA_KEY_CREATION: "constraints/iam.disableServiceAccountKeyCreation",
  VERTEX_SA_EMAIL: "syncapp-vertex-ai@syncapp-ai.iam.gserviceaccount.com",
  /** Default + primary fallback — Gemini 3.8 Flash (Vertex AI / Studio short model id). */
  DEFAULT_MODEL: "gemini-3.8-flash",
  /**
   * Tried in order when the selected model returns 429/503/404.
   * Always prefer gemini-3.8-flash first; include 2.5 Flash for regional Vertex availability.
   */
  MODEL_FALLBACKS: [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
  ] as readonly string[],
  CLIENT_CACHE_AUTH_SA: "sa",
  CLIENT_CACHE_AUTH_ADC: "adc",
  /**
   * Primary Gemini image model on Vertex AI (not Imagen — Imagen endpoints deprecated on Vertex
   * as of 2026-06-30; migrate to Gemini image models).
   */
  IMAGE_MODEL: "gemini-3.1-flash-image",
  /**
   * Fallback Gemini image models when primary is unavailable or rate limited.
   * No Imagen IDs — use Gemini multimodal image generation only.
   */
  IMAGE_MODEL_FALLBACKS: [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-lite-image",
    "gemini-3-pro-image",
    "gemini-3-pro-image-preview",
  ] as readonly string[],
  /** Reject deprecated Imagen model ids if they appear in config lists. */
  IMAGEN_MODEL_PREFIX: "imagen",
  IMAGE_MIME_PNG: "image/png",
  RESPONSE_MIME_JSON: "application/json",
  RESPONSE_MODALITY_TEXT: "TEXT",
  RESPONSE_MODALITY_IMAGE: "IMAGE",
  /** Cover image generation creativity (Gemini multimodal). */
  TEMPERATURE_IMAGE: 0.8,
  /** Single attempt — fall through to next model candidate quickly. */
  SINGLE_ATTEMPT: 1,
  /** @deprecated Prefer SINGLE_ATTEMPT */
  IMAGE_GEN_RETRY_ATTEMPTS: 1,
  IMAGE_ERROR_LOG_MAX_CHARS: 150,
  SA_EMAIL_CACHE_HINT_LEN: 12,
  STUDIO_KEY_CACHE_HINT_LEN: 8,
  CLIENT_CACHE_PREFIX_VERTEX: "vertex",
  CLIENT_CACHE_PREFIX_STUDIO: "studio",
  SA_CACHE_FALLBACK_HINT: "sa",
  CREDENTIAL_FIELD_CLIENT_EMAIL: "client_email",
  CREDENTIAL_FIELD_PRIVATE_KEY: "private_key",
  CREDENTIAL_FIELD_PROJECT_ID: "project_id",
  CREDENTIAL_FIELD_TYPE: "type",
  CREDENTIAL_TYPE_SERVICE_ACCOUNT: "service_account",
  CREDENTIAL_TYPE_AUTHORIZED_USER: "authorized_user",
  ADC_CACHE_HINT: "adc",
  PROVIDER_LABEL_VERTEX: "Vertex AI",
  PROVIDER_LABEL_STUDIO: "AI Studio",
  PROVIDER_LABEL_VERTEX_GEMINI: "Vertex Gemini",
  PROVIDER_LABEL_STUDIO_GEMINI: "AI Studio Gemini",
  LOG_CLIENT_VERTEX: "AI client: Vertex AI (project=",
  LOG_CLIENT_STUDIO: "AI client: Google AI Studio (GEMINI_API_KEY)",
  LOG_CLIENT_LOCATION_SEP: ", location=",
  LOG_CLIENT_VERTEX_CLOSE: ")",
  /**
   * Output token caps (maxOutputTokens). On Gemini 2.5+/3.x Flash, internal "thinking"
   * tokens count toward this budget — see FLASH_THINKING_BUDGET.
   */
  MAX_DRAFT_TOKENS: 8192,
  MAX_EDIT_TOKENS: 4096,
  /** LinkedIn teaser only — short plain text. */
  MAX_LINKEDIN_SUMMARY_TOKENS: 2048,
  /** Max source article characters to inspect when summarizing for LinkedIn. */
  MAX_LINKEDIN_ARTICLE_CHARS: 8000,
  MAX_IMAGE_PROMPT_TOKENS: 512,
  /** Trending topics + keywords: short JSON list. */
  MAX_TRENDING_TOPICS_TOKENS: 768,
  /** Keyword research scored list JSON. */
  MAX_KEYWORD_RESEARCH_TOKENS: 2048,
  /** Trending topics generation temperature. */
  TEMPERATURE_TRENDING: 0.7,
  /** Keyword research temperature — slightly lower for more consistent scoring. */
  TEMPERATURE_KEYWORD_RESEARCH: 0.55,
  /**
   * In-memory TTL for live trending topics + keywords.
   * Keep short so Refresh / reopen stay near real-time; use `?refresh=1` to bypass.
   */
  TRENDING_TOPICS_CACHE_MS: 30 * 1000,
  TRENDING_TOPICS_COUNT: 6,
  GOOGLE_KEYWORDS_COUNT: 8,
  /** In-memory TTL for seeded keyword research (keyed by normalized seed). */
  KEYWORD_RESEARCH_CACHE_MS: 60 * 1000,
  KEYWORD_RESEARCH_COUNT: 10,
  /** Minimum keywords required after parse before accepting a live response. */
  KEYWORD_RESEARCH_PARSE_MIN_ITEMS: 3,
  /** Seed topic length bounds for keyword research. */
  SEED_MIN_LEN: 2,
  SEED_MAX_LEN: 120,
  /** Parsed topic phrase length bounds. */
  TOPIC_MIN_LEN: 8,
  TOPIC_MAX_LEN: 120,
  /** Parsed Google keyword length bounds. */
  KEYWORD_MIN_LEN: 3,
  KEYWORD_MAX_LEN: 60,
  /** Minimum items required after parse before accepting a live response. */
  TRENDING_PARSE_MIN_ITEMS: 3,
  /** Monetization angle / rationale string caps. */
  MONETIZATION_ANGLE_MAX_LEN: 120,
  RATIONALE_MAX_LEN: 200,
  /** Commercial intent / competition / opportunity score bounds (AI estimates). */
  KEYWORD_SCORE_MIN: 0,
  KEYWORD_SCORE_MAX: 100,
  /** Default intent when the model omits or invents a label. */
  KEYWORD_INTENT_DEFAULT: "informational" as const,
  /** Allowed intent labels from keyword research. */
  KEYWORD_INTENT_LABELS: ["transactional", "commercial", "informational"] as const,
  /** Max autocomplete suggestions included in keyword-research prompts. */
  KEYWORD_RESEARCH_AUTOCOMPLETE_MAX: 12,
  /** Random seed category groups used for trending autocomplete. */
  TRENDING_SEED_CATEGORY_COUNT: 2,
  /** Max sampled autocomplete queries for trending context. */
  TRENDING_AUTOCOMPLETE_SAMPLE_MAX: 10,
  /** Truncate AI error messages in logs. */
  AI_ERROR_LOG_MAX_CHARS: 400,
  /** Google Suggest autocomplete endpoint. */
  GOOGLE_SUGGEST_BASE_URL: "https://suggestqueries.google.com/complete/search",
  GOOGLE_SUGGEST_CLIENT: "chrome",
  GOOGLE_SUGGEST_USER_AGENT: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  GOOGLE_SUGGEST_TIMEOUT_MS: 3000,
  /** Top popular DEV.to tags from /api/tags (ordered by reach). */
  DEVTO_REACH_TAGS_COUNT: 12,
  DEVTO_REACH_TAGS_MIN: 3,
  /** Cache DEV.to tags longer — popularity shifts slowly. */
  DEVTO_REACH_TAGS_CACHE_MS: 60 * 60 * 1000,
  DEVTO_API_USER_AGENT: "SyncApp/1.0",
  DEVTO_TAG_NAME_PATTERN: /^[a-z0-9][a-z0-9-]{0,29}$/,
  /** Structured posts: enough creativity, stable JSON. */
  TEMPERATURE_POST: 0.55,
  /** Inline edits: stay close to source text. */
  TEMPERATURE_EDIT: 0.25,
  TOP_P: 0.95,
  /** 0 = disable Flash thinking so maxOutputTokens go to visible JSON/text, not reasoning. */
  FLASH_THINKING_BUDGET: 0,
  /** Keep low — retries × slow 503s previously exceeded the client AI timeout. */
  RETRY_ATTEMPTS: 2,
  RETRY_BASE_DELAY_MS: 400,
  RETRY_JITTER_MAX_MS: 200,
  /** Single attempt (trending grounding, image model try, Pro models). */
  RETRY_ATTEMPTS_ONCE: 1,
  /** Pro models: one shot then fall back (avoid burning retries on 429). */
  PRO_MODEL_RETRY_ATTEMPTS: 1,
  PRO_MODEL_NAME_PATTERN: /pro/i,
  FLASH_MODEL_NAME_PATTERN: /flash/i,
  /** Error / status substrings used when normalizing Google GenAI failures. */
  ERR_UNAUTHENTICATED: "UNAUTHENTICATED",
  ERR_PERMISSION_DENIED: "PERMISSION_DENIED",
  ERR_DEFAULT_CREDENTIALS: "Could not load the default credentials",
  ERR_INVALID_GRANT: "invalid_grant",
  ERR_INVALID_RAPT: "invalid_rapt",
  ERR_HTTP_403: "403",
  ERR_HTTP_401: "401",
  ERR_API_KEY_INVALID: "API_KEY_INVALID",
  ERR_API_KEY_NOT_VALID: "API key not valid",
  ERR_HTTP_404: "404",
  ERR_NOT_FOUND: "NOT_FOUND",
  ERR_MODELS_PATH: "models/",
  ERR_PUBLISHER_MODEL: "Publisher Model",
  ERR_PUBLISHERS_GOOGLE: "publishers/google",
  ERR_HTTP_429: "429",
  ERR_RESOURCE_EXHAUSTED: "RESOURCE_EXHAUSTED",
  ERR_RESOURCE_EXHAUSTED_MSG: "Resource exhausted",
  ERR_HTTP_503: "503",
  ERR_UNAVAILABLE: "UNAVAILABLE",
  ERR_HIGH_DEMAND: "high demand",
  ERR_CURRENTLY_EXPERIENCING: "currently experiencing",
  ERR_PREPAYMENT_CREDITS: "prepayment credits are depleted",
  ERR_PREPAY: "prepay",
  ERR_CODE_402_JSON: '"code":402',
  ERR_VERTEX_AUTH_HINT_PATTERN: /vertex|aiplatform|iam|permission/i,
  ERR_API_KEY_PATTERN: /invalid.*api.?key/i,
  ERR_FALLBACK_WORTHY_PATTERN:
    /404|NOT_FOUND|not found|429|RESOURCE_EXHAUSTED|Resource exhausted|503|UNAVAILABLE|high demand|currently experiencing/i,
  /** Transient transport/server errors eligible for withRetry(). */
  ERR_RETRYABLE_PATTERN: /503|UNAVAILABLE|high demand|500|INTERNAL|ECONNRESET|ETIMEDOUT|fetch failed|network/i,
  ERR_RATE_LIMIT_PATTERN: /429|RESOURCE_EXHAUSTED|Resource exhausted/i,
  ERR_CODE_402_PATTERN: /"code"\s*:\s*402/,
} as const);

/** Resolve request model or fall back to env default. */
export function resolveContentModel(requested?: string): string {
  const trimmed = requested?.trim();
  if (trimmed && isAllowedContentModel(trimmed)) {
    return trimmed;
  }
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

/**
 * System instructions per model role. Centralising here keeps aiService.ts clean
 * and makes it easy to iterate on behavioural guidelines without touching service logic.
 */
export const AI_SYSTEM_INSTRUCTIONS = Object.freeze({
  /** General-purpose base model used for internal helper calls. */
  BASE: "You are a helpful AI assistant. Respond clearly and concisely. Do not produce harmful, illegal, or deceptive content.",
} as const);
