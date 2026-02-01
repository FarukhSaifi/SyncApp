/**
 * Validation Constants
 * Defines validation rules, limits, and constraints used across models and validators
 */

// String length constraints
const STRING_LIMITS = Object.freeze({
  // Username
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,

  // Password
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 128,

  // Names
  FIRST_NAME_MAX: 50,
  LAST_NAME_MAX: 50,
  DISPLAY_NAME_MAX: 100,

  // Bio/Description
  BIO_MAX: 500,

  // Post
  POST_TITLE_MAX: 500,
  POST_SLUG_MAX: 120,

  // Email
  EMAIL_MAX: 255,
});

// Numeric constraints
const NUMERIC_LIMITS = Object.freeze({
  // Pagination
  PAGE_MIN: 1,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  DEFAULT_LIMIT: 20,

  // Bcrypt
  BCRYPT_SALT_ROUNDS: 12,

  // Slug generation
  SLUG_MAX_SUFFIX_ATTEMPTS: 6,
  SLUG_UUID_LENGTH: 6,

  // Default user ID
  DEFAULT_USER_ID: 1,
});

// Regular expressions
const REGEX_PATTERNS = Object.freeze({
  EMAIL: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  URL: /^https?:\/\/.+/,
});

// Validation error messages
const VALIDATION_ERRORS = Object.freeze({
  INVALID_EMAIL: "Please enter a valid email",
  INVALID_USERNAME: "Username must be alphanumeric",
  USERNAME_TOO_SHORT: `Username must be at least ${STRING_LIMITS.USERNAME_MIN} characters`,
  USERNAME_TOO_LONG: `Username cannot exceed ${STRING_LIMITS.USERNAME_MAX} characters`,
  PASSWORD_TOO_SHORT: `Password must be at least ${STRING_LIMITS.PASSWORD_MIN} characters`,
  PASSWORD_TOO_LONG: `Password cannot exceed ${STRING_LIMITS.PASSWORD_MAX} characters`,
  TITLE_TOO_LONG: `Title cannot exceed ${STRING_LIMITS.POST_TITLE_MAX} characters`,
  TITLE_REQUIRED: "Title is required",
  CONTENT_REQUIRED: "Content is required",
  VALIDATION_FAILED: "Validation failed",
  QUERY_VALIDATION_FAILED: "Query validation failed",
  FIELD_ALREADY_EXISTS: "already exists",
});

module.exports = {
  STRING_LIMITS,
  NUMERIC_LIMITS,
  REGEX_PATTERNS,
  VALIDATION_ERRORS,
};
