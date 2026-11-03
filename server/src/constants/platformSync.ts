/**
 * Platform sync policy for post save / publish.
 *
 * Audit P3 (intentional non-sync): schedule, SEO scorecard fields, and status are
 * SyncApp local workflow metadata — platforms do not need them on every save.
 * LinkedIn cover is not applicable to the current text-only UGC share flow.
 *
 * Keep publish payloads and sync-on-save triggers aligned with these lists.
 * Do not expand DEV.to / WordPress sync from this file alone.
 */

export const PLATFORM_SYNC = Object.freeze({
  /**
   * Persist locally only. Must NOT appear in platform publish/sync bodies and must
   * NOT alone trigger sync-on-save (see postsService updatePost).
   */
  LOCAL_ONLY_ON_SAVE: Object.freeze([
    "scheduled_for",
    "scheduled_platforms",
    "seo_score",
    "seo_score_summary",
    "seo_primary_keyword",
    "seo_optimization_targets",
    "status",
  ] as const),

  /**
   * Fields that may be pushed to DEV.to when a live article is updated on save.
   * Mirrors buildDevtoArticlePayload (cover_image → main_image).
   */
  DEVTO_SYNCABLE_ON_SAVE: Object.freeze([
    "title",
    "content_markdown",
    "tags",
    "meta_description",
    "canonical_url",
    "cover_image",
  ] as const),

  /**
   * Fields that may be pushed to WordPress when a live post is updated on save.
   * Core WP REST: title/content/tags + featured_media (cover upload).
   * meta_description / canonical_url require Yoast/Rank Math — not synced (API limitation).
   */
  WORDPRESS_SYNCABLE_ON_SAVE: Object.freeze(["title", "content_markdown", "tags", "cover_image"] as const),

  /**
   * Core WordPress REST has no SEO meta/canonical without a plugin.
   * Documented blocker — do not fake these fields on the posts endpoint.
   */
  WORDPRESS_SEO_META_SYNC: "unsupported_needs_seo_plugin" as const,

  /**
   * LinkedIn publish uses UGC shareCommentary with MEDIA_CATEGORY_NONE.
   * Cover image / full article body are intentionally not synced (API / product scope).
   */
  LINKEDIN_COVER_SYNC: "not_applicable" as const,

  /**
   * Medium Posts API is create-only — no update after first publish.
   * Save-path field/cover sync is unsupported (API limitation, not a SyncApp gap).
   */
  MEDIUM_SAVE_SYNC: "unsupported_create_only" as const,

  /**
   * LinkedIn UGC always creates a NEW share; Save does not edit the previous post.
   */
  LINKEDIN_SAVE_SYNC: "unsupported_no_edit_in_place" as const,
});

export type PlatformSyncLocalOnlyField = (typeof PLATFORM_SYNC.LOCAL_ONLY_ON_SAVE)[number];
export type PlatformSyncDevtoSyncableField = (typeof PLATFORM_SYNC.DEVTO_SYNCABLE_ON_SAVE)[number];
export type PlatformSyncWordpressSyncableField = (typeof PLATFORM_SYNC.WORDPRESS_SYNCABLE_ON_SAVE)[number];

export function isLocalOnlyOnSaveField(field: string): field is PlatformSyncLocalOnlyField {
  return (PLATFORM_SYNC.LOCAL_ONLY_ON_SAVE as readonly string[]).includes(field);
}
