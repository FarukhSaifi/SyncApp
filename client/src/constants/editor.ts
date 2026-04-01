/**
 * Editor-related constants: initial form state, autosave, layout.
 * Keeps magic values out of Editor components and makes tuning easier.
 */
export const INITIAL_EDITOR_FORM = Object.freeze({
  title: "",
  content_markdown: "",
  status: "draft",
  cover_image: "",
  canonical_url: "",
} as const);


export const SCROLL_TO_TOP_THRESHOLD = 300;

/** Autosave interval (ms). Drafts are saved automatically when dirty. */
export const AUTOSAVE_INTERVAL_MS = 30_000;

/** Average reading speed used for "X min read" calculation. */
export const READING_SPEED_WPM = 238;

/** Left sidebar collapsible section labels */
export const SIDEBAR_SECTIONS = Object.freeze({
  POST_SETTINGS: "Post Settings",
  TAGS: "Tags",
  FEATURED_IMAGE: "Featured Image",
  CANONICAL_URL: "Canonical URL",
  SEO_SCORE: "SEO Score",
} as const);

/** Right sidebar section labels */
export const PUBLISH_SECTIONS = Object.freeze({
  STATUS: "Status",
  PUBLISH: "Publish",
  PLATFORMS: "Platforms",
  AI_ASSISTANT: "AI Assistant",
  EXPORT: "Export",
} as const);

/** Keyboard shortcut descriptions */
export const SHORTCUTS = Object.freeze({
  SAVE: { key: "s", meta: true, label: "Save draft" },
  PREVIEW: { key: "p", meta: true, shift: true, label: "Toggle preview" },
  ESC: { key: "Escape", label: "Close sidebar" },
} as const);

/** Editor layout breakpoints */
export const EDITOR_BREAKPOINTS = Object.freeze({
  /** Below this, sidebars become drawers */
  SIDEBAR_COLLAPSE: 1024,
} as const);
