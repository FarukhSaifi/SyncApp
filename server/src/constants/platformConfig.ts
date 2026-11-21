/**
 * Platform Publishing Configuration Metadata
 * Defines error messages and publish settings for each platform.
 * Note: Publish functions are imported directly in controllers to avoid circular dependencies.
 *
 * Sync limitations (API — not SyncApp gaps):
 * - Medium: create-only posts API; no update after first publish (title/body/cover stay on Medium).
 * - LinkedIn: UGC Posts always create a NEW share; no edit-in-place; current payload is text-only
 *   (MEDIA_CATEGORY_NONE) so cover is N/A.
 * - WordPress: core REST syncs title/content/tags/featured_media. meta_description + canonical_url
 *   need Yoast/Rank Math REST fields — not on bare WP. scheduled_for + seo_score stay SyncApp-local.
 * - Schedule + SEO fields stay local to SyncApp for Medium and LinkedIn (not pushed by those APIs).
 */

export const PLATFORM_CONFIG = Object.freeze({
  medium: {
    name: "Medium",
    errorMessage: "Medium API credentials not found. Please configure your Medium API key in settings.",
    publishStatus: "public",
    contentFormat: "markdown",
    /** Medium API has no update endpoint — save-sync of fields/cover is unsupported. */
    supportsRemoteUpdate: false,
  },
  devto: {
    name: "DEV.to",
    errorMessage: "DEV.to API credentials not found. Please configure your DEV.to API key in settings.",
    published: true,
    /** Hard API max — see PLATFORM_TAG_LIMITS.DEVTO */
    maxTags: 4,
    supportsRemoteUpdate: true,
  },
  wordpress: {
    name: "WordPress",
    errorMessage: "WordPress API credentials not found. Please configure your WordPress API key in settings.",
    /** Legacy default; create uses WORDPRESS.CREATE_STATUS (draft), live uses LIVE_STATUS. */
    status: "publish",
    supportsRemoteUpdate: true,
    /** Core WP REST has no SEO meta/canonical without a plugin — do not fake those fields. */
    supportsSeoMeta: false,
  },
  linkedin: {
    name: "LinkedIn",
    errorMessage: "LinkedIn is not connected. Connect LinkedIn in Settings to publish the summary.",
    /** Ideal hashtag count in commentary — see PLATFORM_TAG_LIMITS.LINKEDIN */
    maxHashtags: 5,
    /** UGC create-only; cover not in text-post payload. */
    supportsRemoteUpdate: false,
    supportsCoverImage: false,
  },
} as const);
