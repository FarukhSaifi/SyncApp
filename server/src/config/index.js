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
  port: parseInt(process.env.PORT || "3001", 10),
  mongoUri: requireEnv("MONGODB_URI"),
  jwtSecret: requireEnv("JWT_SECRET", undefined, {}),
  corsOrigin: requireEnv("CORS_ORIGIN", "http://localhost:3000", { optional: true }),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },
  encryption: {
    key: requireEnv("ENCRYPTION_KEY", undefined, {}),
    iv: requireEnv("ENCRYPTION_IV", undefined, {}),
  },
};

module.exports = { config, requireEnv };
