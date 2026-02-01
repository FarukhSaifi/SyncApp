/**
 * External API URLs and Endpoints
 */

module.exports = Object.freeze({
  // Medium API
  MEDIUM: {
    BASE_URL: "https://api.medium.com/v1",
    ME_ENDPOINT: "https://api.medium.com/v1/me",
    POSTS_ENDPOINT: (userId) => `https://api.medium.com/v1/users/${userId}/posts`,
  },

  // DEV.to API
  DEVTO: {
    BASE_URL: "https://dev.to/api",
    ARTICLES_ENDPOINT: "https://dev.to/api/articles",
  },

  // WordPress API
  WORDPRESS: {
    POSTS_ENDPOINT: (siteUrl) => `${siteUrl}/wp-json/wp/v2/posts`,
  },
});
