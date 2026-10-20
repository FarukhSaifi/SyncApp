/**
 * External API URLs and Endpoints
 */

export const API_URLS = {
  // Medium API
  MEDIUM: {
    BASE_URL: "https://api.medium.com/v1",
    ME_ENDPOINT: "https://api.medium.com/v1/me",
    POSTS_ENDPOINT: (userId: string) => `https://api.medium.com/v1/users/${userId}/posts`,
  },

  // DEV.to API
  DEVTO: {
    BASE_URL: "https://dev.to/api",
    ARTICLES_ENDPOINT: "https://dev.to/api/articles",
    ARTICLE_BY_ID: (id: string) => `https://dev.to/api/articles/${id}`,
    /** Authenticated user's articles (includes page_views_count when api-key is set). */
    ARTICLES_ME_ENDPOINT: "https://dev.to/api/articles/me",
    /** Popular tags ordered by reach — https://developers.forem.com/api/v1#tag/tags/operation/getTags */
    TAGS_ENDPOINT: "https://dev.to/api/tags",
  },

  // WordPress API
  WORDPRESS: {
    POSTS_ENDPOINT: (siteUrl: string) => `${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`,
    POST_BY_ID: (siteUrl: string, id: string) => `${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts/${id}`,
  },

  // LinkedIn OAuth + Share (UGC Posts API — Share on LinkedIn / w_member_social)
  LINKEDIN: {
    AUTHORIZE_URL: "https://www.linkedin.com/oauth/v2/authorization",
    TOKEN_URL: "https://www.linkedin.com/oauth/v2/accessToken",
    USERINFO_URL: "https://api.linkedin.com/v2/userinfo",
    UGC_POSTS_URL: "https://api.linkedin.com/v2/ugcPosts",
    /** Space-delimited; OpenID Connect + member share. Must match enabled LinkedIn products. */
    SCOPES: "openid profile email w_member_social",
    PERSON_URN_PREFIX: "urn:li:person:",
    RESTLI_PROTOCOL_VERSION: "2.0.0",
    RESTLI_PROTOCOL_HEADER: "X-Restli-Protocol-Version",
    OAUTH_STATE_PURPOSE: "linkedin_oauth",
    OAUTH_STATE_JWT_EXPIRES: "10m",
    /** Refresh a few minutes before access-token expiry. */
    TOKEN_REFRESH_SKEW_MS: 5 * 60 * 1000,
    OAUTH_RESPONSE_TYPE: "code",
    OAUTH_GRANT_AUTHORIZATION_CODE: "authorization_code",
    OAUTH_GRANT_REFRESH_TOKEN: "refresh_token",
    UGC: {
      LIFECYCLE_PUBLISHED: "PUBLISHED",
      SHARE_CONTENT_TYPE: "com.linkedin.ugc.ShareContent",
      MEMBER_NETWORK_VISIBILITY: "com.linkedin.ugc.MemberNetworkVisibility",
      VISIBILITY_PUBLIC: "PUBLIC",
      MEDIA_CATEGORY_NONE: "NONE",
    },
    /** Query params on client Settings redirect after OAuth. */
    SETTINGS_QUERY: {
      CONNECTED_KEY: "linkedin",
      CONNECTED_VALUE: "connected",
      ERROR_KEY: "linkedin_error",
    },
    FEED_UPDATE_URL: (urn: string) => `https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}`,
  },
} as const;
