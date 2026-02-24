require("dotenv").config();
const DEFAULT_VALUES = require("../constants/defaultValues");

function requireEnv(name, fallback, { optional = false } = {}) {
  const value = process.env[name] ?? fallback;
  if (!optional && (value === undefined || value === null || value === "")) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const config = {
  nodeEnv: process.env.NODE_ENV || DEFAULT_VALUES.NODE_ENV_PRODUCTION,
  port: parseInt(process.env.PORT || String(DEFAULT_VALUES.DEFAULT_PORT), 10),
  mongoUri: requireEnv("MONGODB_URI"),
  jwtSecret: requireEnv("JWT_SECRET", undefined, {}),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_VALUES.DEFAULT_JWT_EXPIRES_IN,
  corsOrigin: requireEnv("CORS_ORIGIN", DEFAULT_VALUES.DEFAULT_CORS_ORIGIN, {
    optional: true,
  }),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(DEFAULT_VALUES.DEFAULT_RATE_LIMIT_WINDOW_MS), 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || String(DEFAULT_VALUES.DEFAULT_RATE_LIMIT_MAX_REQUESTS), 10),
  },
  encryption: {
    key: requireEnv("ENCRYPTION_KEY", undefined, {}),
    iv: requireEnv("ENCRYPTION_IV", undefined, {}),
  },
  // AI (Google Vertex AI) – optional; AI routes return 503 if project not set
  googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT || "",
  googleCloudLocation: process.env.GOOGLE_CLOUD_LOCATION || DEFAULT_VALUES.DEFAULT_GOOGLE_CLOUD_LOCATION,
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  aiUseGoogleSearchRetrieval: process.env.AI_USE_GOOGLE_SEARCH_RETRIEVAL !== "false",
  // Base URL for auto-generated canonical URLs (from post slug). e.g. https://yourblog.com/blog
  canonicalBaseUrl: (process.env.CANONICAL_BASE_URL || process.env.SITE_URL || "").trim().replace(/\/$/, ""),
};

module.exports = { config, requireEnv };
