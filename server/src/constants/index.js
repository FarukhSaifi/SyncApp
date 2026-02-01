/**
 * Central exports for all server constants
 */
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require("./messages");
const { USER_ROLES } = require("./userRoles");
const HTTP_STATUS = require("./httpStatus");
const DEFAULT_VALUES = require("./defaultValues");
const { STRING_LIMITS, NUMERIC_LIMITS, REGEX_PATTERNS, VALIDATION_ERRORS } = require("./validation");
const DATABASE = require("./database");
const API_URLS = require("./api");
const FIELDS = require("./fields");
const { PLATFORM_CONFIG } = require("./platformConfig");
const DEFAULT_PASSWORDS = require("./defaultPasswords");
const HTTP_CONSTANTS = require("./http");
const MDX_CONFIG = require("./mdx");
const { AI_PROMPTS, AI_CONFIG } = require("./ai");

// Platform identifiers
const PLATFORMS = Object.freeze({
  MEDIUM: "medium",
  DEVTO: "devto",
  WORDPRESS: "wordpress",
  HASHNODE: "hashnode",
});

// Post status values
const POST_STATUS = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
});

// Valid platform array
const VALID_PLATFORMS = Object.freeze(Object.values(PLATFORMS));

// Valid post status array
const VALID_POST_STATUS = Object.freeze(Object.values(POST_STATUS));

module.exports = {
  // Messages
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,

  // User roles
  USER_ROLES,

  // HTTP Status
  HTTP_STATUS,

  // Default values
  DEFAULT_VALUES,

  // Validation
  STRING_LIMITS,
  NUMERIC_LIMITS,
  REGEX_PATTERNS,
  VALIDATION_ERRORS,

  // Database
  DATABASE,

  // API URLs
  API_URLS,

  // Field names
  FIELDS,

  // Platform config
  PLATFORM_CONFIG,

  // Default passwords
  DEFAULT_PASSWORDS,

  // HTTP
  HTTP: HTTP_CONSTANTS,

  // MDX
  MDX_CONFIG,

  // AI
  AI_PROMPTS,
  AI_CONFIG,

  // Platforms
  PLATFORMS,
  VALID_PLATFORMS,

  // Post status
  POST_STATUS,
  VALID_POST_STATUS,

  // For backward compatibility, export common values directly
  DEFAULT_PAGE_SIZE: DEFAULT_VALUES.DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE: DEFAULT_VALUES.MAX_PAGE_SIZE,
};
