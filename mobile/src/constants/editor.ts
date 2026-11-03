export const EDITOR_CONFIG = Object.freeze({
  AUTOSAVE_INTERVAL_MS: 60_000,
  EDITOR_DEBOUNCE_MS: 300,
  AI_IMAGE_STYLE_PROMPT: "minimal, no text",
  AI_EDIT_DEFAULT_ACTION: "Proofread and improve clarity",
  SCHEDULE_PLACEHOLDER: "2025-12-31T09:00",
  LINKEDIN_POST_MAX_CHARS: 1300,
} as const);

/** Max soft SEO warning lines joined into a single publish toast. */
export const PUBLISH_WARNING_TOAST_MAX = 3;
