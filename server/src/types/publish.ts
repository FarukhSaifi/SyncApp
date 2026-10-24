/**
 * Platform publishing, scheduling, and outcome types.
 */

import type { NotificationResult } from "./common";
import type { ICredentialDocument, IPostDocument } from "./documents";
import type { ScheduledPublishOutcome } from "./fromConstants";

export type PlatformPublishAction = "create" | "update" | "skip";

export interface PlatformPublishResult {
  updates: Record<string, unknown>;
  action: PlatformPublishAction;
}

export type PublishFn = (post: IPostDocument, credential: ICredentialDocument) => Promise<PlatformPublishResult>;

export interface PlatformConfigWithFn {
  name: string;
  errorMessage?: string;
  publishFn: PublishFn;
  [key: string]: unknown;
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
