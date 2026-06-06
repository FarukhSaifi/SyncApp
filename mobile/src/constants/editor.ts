export const EDITOR_CONFIG = Object.freeze({
  AUTOSAVE_INTERVAL_MS: 60_000,
  AI_IMAGE_STYLE_PROMPT: "minimal, no text",
  AI_EDIT_DEFAULT_ACTION: "Proofread and improve clarity",
  SCHEDULE_PLACEHOLDER: "2025-12-31T09:00",
  /** SVG data URLs shorter than this are treated as server placeholders */
  PLACEHOLDER_SVG_MAX_LENGTH: 2000,
} as const);
