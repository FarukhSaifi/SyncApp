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
  },

  // WordPress API
  WORDPRESS: {
    POSTS_ENDPOINT: (siteUrl: string) => `${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`,
    POST_BY_ID: (siteUrl: string, id: string) =>
      `${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts/${id}`,
  },
} as const;
