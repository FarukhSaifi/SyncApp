import { z } from "zod";
import { loadAppEnv } from "./loadEnv";

loadAppEnv();

import { AI_CONFIG } from "../constants/ai";
import { DEFAULT_VALUES } from "../constants/defaultValues";
import { NOTIFICATION_CC_EMAIL_DEFAULT } from "../constants/notifications";
import type { AppConfig } from "../types";

const envSchema = z.object({
  NODE_ENV: z.string().default(DEFAULT_VALUES.NODE_ENV_PRODUCTION),
  PORT: z.string().default(String(DEFAULT_VALUES.DEFAULT_PORT)),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default(DEFAULT_VALUES.DEFAULT_JWT_EXPIRES_IN),
  ENCRYPTION_KEY: z
    .string()
    .length(64, "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
    .regex(/^[0-9a-fA-F]{64}$/, "ENCRYPTION_KEY must be a valid hex string"),
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),
  GCS_BUCKET_NAME: z.string().optional().default(""),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GOOGLE_AI_MODEL: z.string().default(AI_CONFIG.DEFAULT_MODEL),
  RATE_LIMIT_WINDOW_MS: z.string().default(String(DEFAULT_VALUES.DEFAULT_RATE_LIMIT_WINDOW_MS)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default(String(DEFAULT_VALUES.DEFAULT_RATE_LIMIT_MAX_REQUESTS)),
  GOOGLE_CLOUD_PROJECT: z.string().optional().default(""),
  AI_USE_GOOGLE_SEARCH_RETRIEVAL: z.string().optional().default("false"),
  CANONICAL_BASE_URL: z.string().optional().default(""),
  SITE_URL: z.string().optional().default(""),
  CRON_SECRET: z.string().optional().default(""),
  SLACK_WEBHOOK_URL: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  NOTIFICATION_FROM_EMAIL: z.string().optional().default(""),
  NOTIFICATION_CC_EMAIL: z.string().optional().default(NOTIFICATION_CC_EMAIL_DEFAULT),
  LINKEDIN_CLIENT_ID: z.string().optional().default(""),
  LINKEDIN_CLIENT_SECRET: z.string().optional().default(""),
  LINKEDIN_REDIRECT_URI: z.string().optional().default(""),
});

const rawGeminiKey = (
  process.env[AI_CONFIG.ENV_GEMINI_API_KEY] ||
  process.env[AI_CONFIG.ENV_GOOGLE_API_KEY] ||
  process.env.GEMINI_API_KEY ||
  ""
)
  .split("#")[0]
  .trim();

const rawBucketName = (
  process.env.GCS_BUCKET_NAME ||
  process.env.GOOGLE_CLOUD_BUCKET ||
  (process.env.GOOGLE_CLOUD_PROJECT ? `${process.env.GOOGLE_CLOUD_PROJECT}.firebasestorage.app` : "")
)
  .split("#")[0]
  .trim();

const parsedEnv = envSchema.safeParse({
  ...process.env,
  GEMINI_API_KEY: rawGeminiKey,
  GCS_BUCKET_NAME: rawBucketName,
});

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `  - [${issue.path.join(".")}]: ${issue.message}`)
    .join("\n");
  const vercelHint =
    process.env.VERCEL || process.env.VERCEL_ENV
      ? " Set required variables on Vercel under Project Settings → Environment Variables."
      : " Check your server/.env.dev or server/.env file.";
  throw new Error(`Environment validation failed:${vercelHint}\n${issues}`);
}

const env = parsedEnv.data;

export const config: AppConfig = {
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  mongoUri: env.MONGODB_URI,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  corsOrigin: env.CORS_ORIGIN,
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  encryption: {
    key: env.ENCRYPTION_KEY,
  },
  googleCloudProject: env.GOOGLE_CLOUD_PROJECT,
  googleAiModel: env.GOOGLE_AI_MODEL,
  geminiApiKey: env.GEMINI_API_KEY,
  gcpBucketName: env.GCS_BUCKET_NAME,
  aiUseGoogleSearchRetrieval: env.AI_USE_GOOGLE_SEARCH_RETRIEVAL === "true",
  canonicalBaseUrl: env.CANONICAL_BASE_URL.trim().replace(/\/$/, ""),
  siteUrl: env.SITE_URL.trim().replace(/\/$/, ""),
  cronSecret: env.CRON_SECRET,
  slackWebhookUrl: env.SLACK_WEBHOOK_URL,
  resendApiKey: env.RESEND_API_KEY,
  notificationFromEmail: env.NOTIFICATION_FROM_EMAIL,
  notificationCcEmail: env.NOTIFICATION_CC_EMAIL.trim(),
  linkedinClientId: env.LINKEDIN_CLIENT_ID.trim(),
  linkedinClientSecret: env.LINKEDIN_CLIENT_SECRET.trim(),
  linkedinRedirectUri: env.LINKEDIN_REDIRECT_URI.trim(),
};
