/**
 * Editor-related constants: initial form state, autosave, layout.
 */
import { MODAL_SIZES } from "./designTokens";
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
 * Editor layout breakpoints.
 * Desktop: persistent sidebars. Mobile (&lt;lg): full-viewport sheets for Post Settings / Publish & AI.
 */
export const EDITOR_LAYOUT = Object.freeze({
  /** Matches Tailwind `lg` / editor.css `@media (max-width: 1023px)` inverse */
  DESKTOP_MEDIA_QUERY: "(min-width: 1024px)",
} as const);

/**
 * Mobile full-viewport sheet chrome — compact title bar (≤ ~15dvh).
 */
export const EDITOR_DRAWER = Object.freeze({
  TITLE_BAR_CLASS:
    "flex h-12 max-h-[15dvh] shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3",
  TITLE_CLASS: "truncate text-sm font-semibold text-foreground",
  CLOSE_BUTTON_CLASS:
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors touch-manipulation hover:bg-muted hover:text-foreground",
  CLOSE_ICON_CLASS: "h-5 w-5",
  BODY_CLASS: "min-h-0 flex-1 overflow-y-auto bg-background",
} as const);

/** Generate SEO post modal layout */
export const GENERATE_POST_MODAL = Object.freeze({
  SIZE: MODAL_SIZES.THREE_XL,
  ROOT: "space-y-5",
  SECTION: "space-y-3",
  SECTION_TITLE: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
  SETUP_GRID: "grid grid-cols-1 gap-4 lg:grid-cols-2",
  DISCOVER_GRID: "grid grid-cols-1 gap-4 lg:grid-cols-2",
  PANEL: "space-y-2.5 rounded-xl border border-border/70 bg-muted/15 p-3.5 dark:bg-muted/10",
  PANEL_FLAT: "space-y-2.5",
  FOOTER: "flex flex-row items-center justify-end gap-2 pt-1",
  CANCEL_BTN: "flex-1 sm:flex-none",
  GENERATE_BTN: "flex-1 justify-center sm:flex-none sm:min-w-[160px]",
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

/**
 * Featured image frame in the editor Preview tab.
 * LazyImage uses `fill`, so the frame must have an explicit height (sidebar uses h-28).
 */
export const EDITOR_PREVIEW_COVER = Object.freeze({
  FRAME_CLASS: "relative mb-4 h-48 w-full overflow-hidden rounded-lg border border-border bg-muted sm:h-64",
  IMAGE_CLASS: "h-full w-full object-cover",
  CONTAINER_CLASS: "h-full w-full",
} as const);

/** Markdown image LazyImage defaults in the preview tab. */
export const EDITOR_PREVIEW_IMAGE = Object.freeze({
  WIDTH: 1200,
  HEIGHT: 675,
  CLASS: "h-auto w-full rounded-md",
  CONTAINER_CLASS: "my-4 w-full rounded-md",
  SKELETON_CLASS: "absolute inset-0 min-h-[120px]",
} as const);

/** Syntax highlighter chrome for fenced code in markdown preview. */
export const EDITOR_PREVIEW_CODE = Object.freeze({
  WRAP_CLASS: "my-4 overflow-x-auto",
  INLINE_CLASS: "rounded bg-muted px-1.5 py-0.5 font-mono text-sm",
  TAG_WRAP_CLASS: "mt-6 flex flex-wrap gap-2",
  TAG_CLASS: "rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary",
  PROSE_CLASS: "prose prose-base max-w-none",
  ROOT_CLASS: "editor-preview prose prose-base max-w-none p-4 sm:p-6",
  TITLE_CLASS: "mb-4 text-3xl font-bold",
  CUSTOM_STYLE: {
    borderRadius: 8,
    fontSize: "0.875rem",
    padding: "1rem",
    margin: 0,
  },
  LANGUAGE_CLASS_RE: /language-(\w+)/i,
} as const);

/** Editor loading skeletons (toolbar / body / preview placeholders). */
export const EDITOR_SKELETONS = Object.freeze({
  CONTENT_ROOT_CLASS: "editor-main bg-background p-4 sm:p-6 space-y-4",
  PREVIEW_ROOT_CLASS: "editor-preview p-4 sm:p-6 space-y-4",
  TITLE_CLASS: "h-10 w-2/3 max-w-md",
  PREVIEW_TITLE_CLASS: "h-9 w-3/4 max-w-lg",
  TOOLBAR_BTN_CLASS: "h-8 w-8 rounded shrink-0",
  TOOLBAR_COUNT: 10,
  BODY_LINE_COUNT: 8,
  PREVIEW_LINE_COUNT: 6,
  TAG_COUNT: 3,
  LINE_SHORT_CLASS: "h-4 w-3/5",
  LINE_FULL_CLASS: "h-4 w-full",
  PREVIEW_LAST_LINE_CLASS: "h-4 w-2/3",
  COVER_CLASS: "w-full aspect-video max-h-64 rounded-lg",
  TAG_CLASS: "h-7 w-16 rounded-full",
  IMAGE_DEFAULT_CLASS: "w-full aspect-video rounded-lg",
} as const);

/** In-flight AI job keys used by useEditorAI / publish sidebar. */
export const AI_LOADING = Object.freeze({
  IDLE: "",
  POST: "post",
  IMAGE: "image",
  LINKEDIN: "linkedin",
} as const);

/** AI Toolkit dropdown action ids (passed to aiEdit / onAction). */
export const AI_TOOLKIT_ACTIONS = Object.freeze({
  COMMENT: "comment",
  PARAGRAPH: "paragraph",
  PROOFREAD: "proofread",
  ADJUST: "adjust",
  COMPONENT: "component",
  JUSTIFY: "justify",
} as const);

/** AI Toolkit dropdown surface — semantic tokens only (no hex / gray palette). */
export const AI_TOOLKIT_UI = Object.freeze({
  TRIGGER_BASE: "flex items-center gap-2 transition-colors py-1.5 px-3 rounded-md text-xs font-semibold shadow-sm",
  TRIGGER_LOADING: "bg-primary/20 text-primary cursor-wait",
  TRIGGER_IDLE: "bg-muted text-foreground hover:bg-muted/80",
  MENU_PANEL:
    "absolute left-0 top-full mt-2 w-56 rounded-xl bg-card text-card-foreground shadow-lg border border-border overflow-hidden z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100",
  MENU_LIST: "flex flex-col text-sm font-medium text-foreground",
  MENU_ITEM:
    "w-full flex items-center gap-3 px-3 py-2 text-foreground hover:bg-muted transition-colors disabled:opacity-50",
  MENU_ITEM_EMPHASIS:
    "w-full flex items-center gap-3 px-3 py-2 bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50",
  MENU_ICON: "h-4 w-4 shrink-0 text-muted-foreground",
  TRIGGER_ICON: "h-3.5 w-3.5",
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
