require("dotenv").config();

function requireEnv(name, fallback, { optional = false } = {}) {
  const value = process.env[name] ?? fallback;
  if (!optional && (value === undefined || value === null || value === "")) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const config = {
  nodeEnv: process.env.NODE_ENV || "production",
  port: parseInt(process.env.PORT || "9000", 10),
  mongoUri: requireEnv("MONGODB_URI"),
  jwtSecret: requireEnv("JWT_SECRET", undefined, {}),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: requireEnv("CORS_ORIGIN", "http://localhost:3000", {
    optional: true,
  }),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },
  encryption: {
    key: requireEnv("ENCRYPTION_KEY", undefined, {}),
    iv: requireEnv("ENCRYPTION_IV", undefined, {}),
  },
  // AI (Google Vertex AI) – optional; AI routes return 503 if project not set
  googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT || "",
  googleCloudLocation: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  aiUseGoogleSearchRetrieval: process.env.AI_USE_GOOGLE_SEARCH_RETRIEVAL !== "false",
};

module.exports = { config, requireEnv };
