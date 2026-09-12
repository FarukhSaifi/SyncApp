/**
 * Curated Gemini models for the Generate Post picker (must match server AI_CONTENT_MODELS allowlist).
 */
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

export const DEFAULT_AI_CONTENT_MODEL: AiContentModelId = "gemini-3.8-flash";

const ALLOWED_MODEL_IDS = new Set<string>([
  ...AI_CONTENT_MODELS.map((m) => m.id),
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
]);

export function isAllowedContentModel(model: string): boolean {
  return ALLOWED_MODEL_IDS.has(model.trim());
}

export function resolveStoredContentModel(stored?: string | null): AiContentModelId {
  if (stored && isAllowedContentModel(stored)) {
    return stored as AiContentModelId;
  }
  return DEFAULT_AI_CONTENT_MODEL;
}
