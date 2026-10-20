/**
 * HTTP Headers and Content Types
 */

export const HTTP = Object.freeze({
  // Common headers
  HEADERS: {
    CONTENT_TYPE: "Content-Type",
    AUTHORIZATION: "Authorization",
    API_KEY: "api-key",
    CONTENT_DISPOSITION: "Content-Disposition",
    ACCEPT: "Accept",
    USER_AGENT: "User-Agent",
  },

  // Content types
  CONTENT_TYPES: {
    JSON: "application/json",
    MARKDOWN: "text/markdown; charset=utf-8",
    TEXT_PLAIN: "text/plain",
    FORM_URLENCODED: "application/x-www-form-urlencoded",
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
  METHOD: {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    DELETE: "DELETE",
    OPTIONS: "OPTIONS",
  },
} as const);
