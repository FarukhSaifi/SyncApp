/**
 * HTTP Headers and Content Types
 */

module.exports = Object.freeze({
  // Common headers
  HEADERS: {
    CONTENT_TYPE: "Content-Type",
    AUTHORIZATION: "Authorization",
    API_KEY: "api-key",
    CONTENT_DISPOSITION: "Content-Disposition",
  },

  // Content types
  CONTENT_TYPES: {
    JSON: "application/json",
    MARKDOWN: "text/markdown; charset=utf-8",
    TEXT_PLAIN: "text/plain",
  },

  // Authorization schemes
  AUTH_SCHEMES: {
    BEARER: "Bearer",
  },

  // CORS headers
  CORS_HEADERS: {
    ALLOWED: ["Content-Type", "Authorization"],
    EXPOSED: ["Content-Disposition"],
  },

  // HTTP methods
  METHODS: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});
