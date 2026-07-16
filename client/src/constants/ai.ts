/**
 * Curated Gemini models for the Generate Post picker (must match server AI_CONTENT_MODELS allowlist).
 */
export const AI_CONTENT_MODELS = Object.freeze([
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (default, fast)" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (higher quality)" },
  {
    id: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro Preview (paid quota; falls back to Flash Lite)",
  },
] as const);

export type AiContentModelId = (typeof AI_CONTENT_MODELS)[number]["id"];

export const DEFAULT_AI_CONTENT_MODEL: AiContentModelId = "gemini-3.1-flash-lite";

const ALLOWED_MODEL_IDS = new Set<string>(AI_CONTENT_MODELS.map((m) => m.id));

export function isAllowedContentModel(model: string): boolean {
  return ALLOWED_MODEL_IDS.has(model.trim());
}

export function resolveStoredContentModel(stored?: string | null): AiContentModelId {
  if (stored && isAllowedContentModel(stored)) {
    return stored as AiContentModelId;
  }
  return DEFAULT_AI_CONTENT_MODEL;
}
