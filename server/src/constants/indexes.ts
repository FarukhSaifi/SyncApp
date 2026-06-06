/**
 * MongoDB index definitions and legacy cleanup registry.
 * Indexes are declared on Mongoose schemas; this file documents intent and
 * lists obsolete index names to drop during `db:sync-indexes`.
 */

export const POST_INDEXES = Object.freeze({
  /** Public feed: find({ status: "published" }).sort({ createdAt: -1 }) */
  PUBLIC_FEED: { status: 1, createdAt: -1 },
  /** User dashboard: find({ author }).sort({ createdAt: -1 }) */
  AUTHOR_RECENT: { author: 1, createdAt: -1 },
  /** Cron: find({ status: "draft", scheduled_for: { $lte: now } }) */
  SCHEDULED_PUBLISH: { status: 1, scheduled_for: 1 },
  /** Slug lookup: findOne({ slug }) — unique constraint on schema field */
  SLUG_UNIQUE: "slug",
} as const);

export const CREDENTIAL_INDEXES = Object.freeze({
  /** Settings upsert / get by platform */
  AUTHOR_PLATFORM_UNIQUE: { author: 1, platform_name: 1 },
  /** Publish: find({ author, is_active: true }) */
  AUTHOR_ACTIVE: { author: 1, is_active: 1 },
} as const);

export const USER_INDEXES = Object.freeze({
  /** Admin list with role filter + sort */
  ROLE_RECENT: { role: 1, createdAt: -1 },
} as const);

/** Index names to drop when migrating from pre-production schemas */
export const LEGACY_INDEXES_TO_DROP = Object.freeze({
  credentials: ["platform_name_1", "user_id_1", "is_active_1", "author_1"],
  posts: [
    "tags_1",
    "title_text_content_markdown_text",
    "status_1",
    "createdAt_-1",
    "author_1_status_1",
    "scheduled_for_1",
  ],
  users: [],
} as const);
