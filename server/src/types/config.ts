/**
 * Server application configuration types.
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface EncryptionConfig {
  key: string;
  iv?: string;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  rateLimit: RateLimitConfig;
  encryption: EncryptionConfig;
  googleCloudProject: string;
  googleCloudLocation: string;
  googleAiModel: string;
  geminiApiKey: string;
  gcpBucketName: string;
  aiUseGoogleSearchRetrieval: boolean;
  canonicalBaseUrl: string;
  siteUrl: string;
  cronSecret: string;
  slackWebhookUrl: string;
  resendApiKey: string;
  notificationFromEmail: string;
  notificationCcEmail: string;
  linkedinClientId: string;
  linkedinClientSecret: string;
  linkedinRedirectUri: string;
  /** Numeric GA4 property id for Data API reports (empty = website analytics disabled). */
  googleAnalyticsPropertyId: string;
}
