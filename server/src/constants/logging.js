/**
 * Logging constants – keys to redact in production to avoid logging sensitive data
 */
const SENSITIVE_KEYS = Object.freeze([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "secret",
  "apiKey",
  "api_key",
  "apikey",
  "jwt",
  "credentials",
  "body", // request body may contain passwords/tokens
]);

const REDACT_PLACEHOLDER = "[REDACTED]";

module.exports = {
  SENSITIVE_KEYS,
  REDACT_PLACEHOLDER,
};
