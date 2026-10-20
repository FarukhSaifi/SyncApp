/**
 * Editor-related constants: initial form state, autosave, layout.
 */
import { POST_STATUS } from "./postStatus";

export const INITIAL_EDITOR_FORM = Object.freeze({
  title: "",
  content_markdown: "",
  meta_description: "",
  status: POST_STATUS["DRAFT"],
  cover_image: "",
  canonical_url: "",
  scheduled_for: "",
  scheduled_platforms: [] as string[],
  linkedin_post: "",
  linkedin_read_more_url: "",
});

/** Autosave interval (ms). Drafts are saved automatically when dirty. */
export const AUTOSAVE_INTERVAL_MS = 60000;

/** Typing debounce duration (ms) for word count and live calculations. */
export const EDITOR_DEBOUNCE_MS = 300;

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

/**
 * Editor layout breakpoints / drawer sizing.
 * Matches `editor.css` desktop grid (≥1024px) vs mobile drawers.
 */
export const EDITOR_LAYOUT = Object.freeze({
  /** Matches Tailwind `lg` / editor.css `@media (max-width: 1023px)` inverse */
  DESKTOP_MEDIA_QUERY: "(min-width: 1024px)",
  /** Temporary left (post settings) drawer width on sm+ (xs uses full viewport) */
  LEFT_DRAWER_WIDTH_PX: 360,
  /** Temporary right (Publish & AI) drawer width on sm+ (xs uses full viewport) */
  RIGHT_DRAWER_WIDTH_PX: 360,
} as const);

/**
 * Mobile temporary drawer chrome — keep the title bar compact (≤ ~15dvh),
 * matching the app shell header treatment.
 */
export const EDITOR_DRAWER = Object.freeze({
  TITLE_BAR_CLASS: "flex h-12 max-h-[15dvh] shrink-0 items-center justify-between gap-2 border-b border-border px-3",
  TITLE_CLASS: "truncate text-sm font-semibold text-foreground",
  CLOSE_BUTTON_CLASS:
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors touch-manipulation hover:bg-muted hover:text-foreground",
  CLOSE_ICON_CLASS: "h-5 w-5",
  BODY_CLASS: "min-h-0 flex-1 overflow-y-auto",
} as const);

/**
 * Featured / cover image file upload constraints.
 * Must stay aligned with server `presignedUrlRequestSchema` (raster images only, max 6MB).
 */
export const COVER_UPLOAD = Object.freeze({
  ACCEPT: "image/jpeg,image/png,image/gif,image/webp",
  ACCEPT_MIME_PREFIX: "image/",
  MAX_BYTES: 6 * 1024 * 1024,
  INPUT_ID: "editor-featured-cover-upload",
  /** sessionStorage key prefix for base64 cover preview cache */
  PREVIEW_SESSION_PREFIX: "cover_preview_",
} as const);

/** In-flight AI job keys used by useEditorAI / publish sidebar. */
export const AI_LOADING = Object.freeze({
  IDLE: "",
  POST: "post",
  IMAGE: "image",
  LINKEDIN: "linkedin",
} as const);

/** API suggestion-source identifiers for Generate Post modal. */
export const AI_SUGGESTION_SOURCES = Object.freeze({
  GOOGLE_SEARCH: "google_search",
  DEVTO: "devto",
} as const);

/** Keyboard keys used in editor UI handlers. */
export const EDITOR_KEYS = Object.freeze({
  ENTER: "Enter",
  ESCAPE: "Escape",
  SPACE: " ",
} as const);

/** AI-generated cover download filename parts. */
export const AI_COVER_DOWNLOAD = Object.freeze({
  PREFIX: "cover-",
  EXT: ".png",
} as const);

/** Max DEV.to publish warnings shown in a single toast. */
export const PUBLISH_WARNING_TOAST_MAX = 3;

/** Delay before auto-generating cover image after AI draft apply. */
export const AI_COVER_AUTOGEN_DELAY_MS = 500;
