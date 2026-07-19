import { loadAppEnv } from "./loadEnv";

loadAppEnv();

import { AI_CONFIG } from "../constants/ai";
import { DEFAULT_VALUES } from "../constants/defaultValues";
import { NOTIFICATION_CC_EMAIL_DEFAULT } from "../constants/notifications";

import { AppConfig } from "../types";

export function requireEnv(name: string, fallback?: string, options: { optional?: boolean } = {}): string {
  if (name === "__proto__" || name === "constructor" || name === "prototype") {
    throw new Error("Invalid env var name");
  }
  const value = Object.prototype.hasOwnProperty.call(process.env, name)
    ? Object.getOwnPropertyDescriptor(process.env, name)?.value || fallback
    : fallback;
  if (!options.optional && (value === undefined || value === null || value === "")) {
    const vercelEnv = process.env.VERCEL_ENV;
    const vercelHint =
      process.env.VERCEL || vercelEnv
        ? ` Set it on the server Vercel project (Root Directory: server) under Settings → Environment Variables, and enable the "${vercelEnv || "production"}" environment. Redeploy after saving.`
        : "";
    throw new Error(`Missing required env var: ${name}.${vercelHint}`);
  }
  return value as string;
}

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || DEFAULT_VALUES.NODE_ENV_PRODUCTION,
  port: parseInt(process.env.PORT || String(DEFAULT_VALUES.DEFAULT_PORT), 10),
  mongoUri: requireEnv("MONGODB_URI"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_VALUES.DEFAULT_JWT_EXPIRES_IN,
  corsOrigin: requireEnv("CORS_ORIGIN", DEFAULT_VALUES.DEFAULT_CORS_ORIGIN, { optional: true }),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(DEFAULT_VALUES.DEFAULT_RATE_LIMIT_WINDOW_MS), 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || String(DEFAULT_VALUES.DEFAULT_RATE_LIMIT_MAX_REQUESTS), 10),
  },
  encryption: {
    key: requireEnv("ENCRYPTION_KEY"),
    iv: requireEnv("ENCRYPTION_IV"),
  },
  // AI — Studio via GEMINI_API_KEY; GCP project/creds optional for GCS cover uploads
  googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT || "",
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  googleAiModel: process.env[AI_CONFIG.ENV_GOOGLE_AI_MODEL] || AI_CONFIG.DEFAULT_MODEL,
  geminiApiKey: (process.env[AI_CONFIG.ENV_GEMINI_API_KEY] || process.env[AI_CONFIG.ENV_GOOGLE_API_KEY] || "").trim(),
  gcpBucketName:
    process.env.GCS_BUCKET_NAME ||
    process.env.GOOGLE_CLOUD_BUCKET ||
    (process.env.GOOGLE_CLOUD_PROJECT ? `${process.env.GOOGLE_CLOUD_PROJECT}.firebasestorage.app` : ""),
  aiUseGoogleSearchRetrieval: process.env.AI_USE_GOOGLE_SEARCH_RETRIEVAL === "true",
  // Public blog (Farukh.me) for LinkedIn Read more + post canonicals — NOT SyncApp.
  // Do not fall back to SITE_URL (that is the SyncApp client for auth/OAuth/emails).
  canonicalBaseUrl: (process.env.CANONICAL_BASE_URL || "").trim().replace(/\/$/, ""),
  // SyncApp client — login, editor, LinkedIn OAuth return, notification “open in SyncApp” links.
  siteUrl: (process.env.SITE_URL || "").trim().replace(/\/$/, ""),
  cronSecret: process.env.CRON_SECRET || "",
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  notificationFromEmail: process.env.NOTIFICATION_FROM_EMAIL || "",
  notificationCcEmail: (process.env.NOTIFICATION_CC_EMAIL || NOTIFICATION_CC_EMAIL_DEFAULT).trim(),
  linkedinClientId: (process.env.LINKEDIN_CLIENT_ID || "").trim(),
  linkedinClientSecret: (process.env.LINKEDIN_CLIENT_SECRET || "").trim(),
  linkedinRedirectUri: (process.env.LINKEDIN_REDIRECT_URI || "").trim(),
};
