/**
 * Database Field Names
 * Centralized field names for consistency and preventing typos
 */

module.exports = Object.freeze({
  // User fields
  USER_FIELDS: {
    SELECT_PUBLIC: "username firstName lastName",
    SELECT_WITHOUT_PASSWORD: "-password",
    UPDATABLE_FIELDS: ["firstName", "lastName", "bio", "avatar", "role", "isVerified"],
  },

  // Post fields
  POST_FIELDS: {
    LIST_SELECT: "title slug status tags cover_image canonical_url createdAt updatedAt author platform_status",
    UPDATABLE_FIELDS: ["title", "content_markdown", "status", "tags", "cover_image", "canonical_url"],
    PLATFORM_STATUS_PREFIX: "platform_status",
  },

  // Platform status field paths
  PLATFORM_STATUS_FIELDS: {
    PUBLISHED: (platform) => `platform_status.${platform}.published`,
    POST_ID: (platform) => `platform_status.${platform}.post_id`,
    URL: (platform) => `platform_status.${platform}.url`,
    PUBLISHED_AT: (platform) => `platform_status.${platform}.published_at`,
  },

  // Credential fields
  CREDENTIAL_FIELDS: {
    PLATFORM_NAME: "platform_name",
    API_KEY: "api_key",
    SITE_URL: "site_url",
    PLATFORM_CONFIG: "platform_config",
  },

  // Common query fields
  COMMON_FIELDS: {
    ID: "_id",
    CREATED_AT: "createdAt",
    UPDATED_AT: "updatedAt",
    AUTHOR: "author",
    SLUG: "slug",
    STATUS: "status",
  },
});
