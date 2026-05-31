/**
 * Editor-related constants: initial form state, autosave, layout.
 */
import { POST_STATUS } from "./postStatus";

export const INITIAL_EDITOR_FORM = Object.freeze({
  title: "",
  content_markdown: "",
  meta_description: "",
  status: POST_STATUS.DRAFT,
  cover_image: "",
  canonical_url: "",
  scheduled_for: "",
} as const);

/** Autosave interval (ms). Drafts are saved automatically when dirty. */
export const AUTOSAVE_INTERVAL_MS = 60000;

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
