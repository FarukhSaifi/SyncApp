export const SCHEDULED_PUBLISH_OUTCOMES = Object.freeze({
  SUCCESS: "success",
  PARTIAL: "partial",
  FAILED: "failed",
  SKIPPED_NO_CREDENTIALS: "skipped_no_credentials",
} as const);

export type ScheduledPublishOutcome = (typeof SCHEDULED_PUBLISH_OUTCOMES)[keyof typeof SCHEDULED_PUBLISH_OUTCOMES];

export const NOTIFICATION_CHANNEL_STATUS = Object.freeze({
  SENT: "sent",
  SKIPPED: "skipped",
  FAILED: "failed",
} as const);

export type NotificationChannelStatus = (typeof NOTIFICATION_CHANNEL_STATUS)[keyof typeof NOTIFICATION_CHANNEL_STATUS];

export const NOTIFICATION_COPY = Object.freeze({
  EMAIL_SUBJECT_SUCCESS: (title: string) => `Scheduled post published: ${title}`,
  EMAIL_SUBJECT_PARTIAL: (title: string) => `Scheduled post partially published: ${title}`,
  EMAIL_SUBJECT_FAILED: (title: string) => `Scheduled publish failed: ${title}`,
  EMAIL_SUBJECT_SKIPPED: (title: string) => `Scheduled publish skipped (no platforms): ${title}`,
  SLACK_TITLE_SUCCESS: "Scheduled post published",
  SLACK_TITLE_PARTIAL: "Scheduled post partially published",
  SLACK_TITLE_FAILED: "Scheduled publish failed",
  SLACK_TITLE_SKIPPED: "Scheduled publish skipped",
  OUTCOME_LABEL: {
    success: "Published successfully",
    partial: "Partially published",
    failed: "All platforms failed",
    skipped_no_credentials: "No connected platforms",
  },
} as const);

export const CRON_SCHEDULE = "0 0 * * *";

export const SCHEDULED_PUBLISH_MAX_PER_RUN = 10;
