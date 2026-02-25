/**
 * Logging constants – keys to redact in production to avoid logging sensitive data
 */
export const SENSITIVE_KEYS: readonly string[] = Object.freeze([
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

export const REDACT_PLACEHOLDER = "[REDACTED]";

/** Database connection / setup log messages */
export const DB_LOG = Object.freeze({
  ALREADY_CONNECTED: "MongoDB already connected",
  CONNECTED: "Connected to MongoDB database",
  CONNECTION_ERROR: "MongoDB connection error",
  MONGOOSE_CONNECTED: "Mongoose connected to MongoDB",
  MONGOOSE_CONNECTION_ERROR: "Mongoose connection error",
  MONGOOSE_DISCONNECTED: "Mongoose disconnected from MongoDB",
  CONNECTION_CLOSED: "MongoDB connection closed through app termination",
  SETUP_START: "Setting up MongoDB database...",
  CONNECTING: "Connecting to MongoDB",
  CONNECTION_ESTABLISHED: "MongoDB connection established",
  DEFAULT_MEDIUM_CREATED: "Default Medium credentials record created",
  MEDIUM_EXISTS: "Medium credentials already exist",
  DEFAULT_DEVTO_CREATED: "Default DEV.to credentials record created",
  DEVTO_EXISTS: "DEV.to credentials already exist",
  SETUP_COMPLETED: "Database setup completed successfully",
  SETUP_UPDATE_KEYS: "Update API keys in settings",
  SETUP_FAILED: "Database setup failed",
  MONGODB_NOT_RUNNING: "MongoDB not running - start MongoDB or use Atlas",
  CONNECTION_CLOSED_SETUP: "MongoDB connection closed",
} as const);
