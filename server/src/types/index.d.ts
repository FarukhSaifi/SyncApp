/**
 * Shared type definitions for SyncApp server.
 * Use for request/response shapes, service layers, and models.
 */

export interface IPlatformStatus {
  published: boolean;
  post_id?: string;
  url?: string;
  published_at?: Date;
}

export interface IPost {
  _id: string;
  slug?: string;
  title: string;
  content_markdown: string;
  status: "draft" | "published" | "archived";
  author: string;
  platform_status?: {
    medium?: IPlatformStatus;
    devto?: IPlatformStatus;
    wordpress?: IPlatformStatus;
  };
  tags: string[];
  cover_image?: string;
  canonical_url?: string;
  scheduled_for?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  isVerified?: boolean;
  role: "user" | "admin";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICredential {
  _id: string;
  author: string;
  platform_name: string;
  api_key?: string;
  site_url?: string;
  is_active?: boolean;
  platform_config?: {
    devto_username?: string;
    medium_user_id?: string;
    wordpress_url?: string;
  };
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// ----------------------------------------------------
// Service, Controller, Utility, and Config Types
// ----------------------------------------------------

export interface GetUsersParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  role?: string;
  isVerified?: boolean | string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  role?: string;
  isVerified?: boolean;
}

export interface GeneratePostResult {
  title?: string;
  content?: string;
  meta_description?: string;
  tags?: string[];
}

import type { Request as ExpressRequest, Response as ExpressResponse } from "express";

export interface ILogger {
  error(message: string, error?: Error | null, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  request(req: ExpressRequest, res: ExpressResponse, duration: number): void;
  query(operation: string, model: string, duration: number, meta?: Record<string, unknown>): void;
  externalApi(
    service: string,
    endpoint: string,
    duration: number,
    status: number | string,
    meta?: Record<string, unknown>,
  ): void;
  cache(operation: string, key: string, hit?: boolean | null): void;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export interface CreatePostInput {
  title?: string;
  content_markdown?: string;
  status?: "draft" | "published" | "archived" | string;
  tags?: string[];
  cover_image?: string | null;
  canonical_url?: string;
  scheduled_for?: Date | string;
  meta_description?: string;
  author?: string;
}

export interface GetPostsParams {
  page?: number | string;
  limit?: number | string;
  status?: string;
  search?: string;
  userId?: string;
}

export interface GCSCredentials {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  projectId?: string;
  [key: string]: unknown;
}

export type PlatformPublishAction = "create" | "update" | "skip";

export interface PlatformPublishResult {
  updates: Record<string, unknown>;
  action: PlatformPublishAction;
}

export type PublishFn = (post: any, credential: any) => Promise<PlatformPublishResult>;

export interface PlatformConfigWithFn {
  name: string;
  errorMessage?: string;
  publishFn: PublishFn;
  [key: string]: unknown;
}

export interface MongoValidationError extends Error {
  errors: Record<string, { message: string }>;
}

export interface MongoCastError extends Error {
  path: string;
  value: unknown;
}

export interface MongoDuplicateKeyError extends Error {
  code: number;
  keyPattern: Record<string, unknown>;
}

export interface AxiosErrorLike extends Error {
  isAxiosError: boolean;
  response?: {
    status: number;
    data?: { message?: string; error?: string };
  };
  request?: unknown;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface EncryptionConfig {
  key: string;
  iv: string;
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
  googleApplicationCredentials: string;
  googleAiModel: string;
  gcpBucketName: string;
  aiUseGoogleSearchRetrieval: boolean;
  canonicalBaseUrl: string;
  siteUrl: string;
  cronSecret: string;
  slackWebhookUrl: string;
  resendApiKey: string;
  notificationFromEmail: string;
  notificationCcEmail: string;
}

// ----------------------------------------------------
// Schedule, publish, and notification types
// ----------------------------------------------------

import type { NotificationChannelStatus, ScheduledPublishOutcome } from "../constants/notifications";

export interface NormalizeScheduledForOptions {
  currentStatus?: string;
  requireFuture?: boolean;
}

export interface PlatformPublishError {
  platform: string;
  error: string;
}

export interface PublishToActivePlatformsResult {
  platformUpdates: Record<string, unknown>;
  successes: string[];
  errors: PlatformPublishError[];
}

export type ScheduledPublishReason = "NO_CREDENTIALS" | "ALL_PLATFORMS_FAILED";

export interface NotificationResult {
  slack: NotificationChannelStatus;
  email: NotificationChannelStatus;
}

export interface ScheduledPublishNotificationPayload {
  postId: string;
  title: string;
  authorEmail?: string;
  authorName?: string;
  outcome: ScheduledPublishOutcome;
  successes?: string[];
  errors?: PlatformPublishError[];
  scheduledFor?: Date;
}

export interface ScheduledPublishPostResult {
  postId: string;
  title: string;
  outcome: ScheduledPublishOutcome;
  reason?: ScheduledPublishReason;
  successes: string[];
  errors: PlatformPublishError[];
  notification: NotificationResult;
}

export interface PublishScheduledPostsResult {
  processed: number;
  truncated: boolean;
  results: ScheduledPublishPostResult[];
}

export interface CronPublishScheduledResponse {
  success: boolean;
  operationId: "publishScheduledPosts";
  message: string;
  data: {
    processed: number;
    truncated: boolean;
    cronSchedule: string;
    results: ScheduledPublishPostResult[];
  };
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
