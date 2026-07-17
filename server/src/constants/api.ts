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
    FEED_UPDATE_URL: (urn: string) => `https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}`,
  },
} as const;
