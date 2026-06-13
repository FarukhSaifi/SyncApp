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

export const NOTIFICATION_LINKS = Object.freeze({
  DASHBOARD_PATH: "/",
  EDITOR_PATH_PREFIX: "/editor",
} as const);

export const NOTIFICATION_COPY = Object.freeze({
  EMAIL_SUBJECT_SUCCESS: (title: string) => `Scheduled post published: ${title}`,
  EMAIL_SUBJECT_PARTIAL: (title: string) => `Scheduled post partially published: ${title}`,
  EMAIL_SUBJECT_FAILED: (title: string) => `Scheduled publish failed: ${title}`,
  EMAIL_SUBJECT_SKIPPED: (title: string) => `Scheduled publish skipped (no platforms): ${title}`,
  SLACK_HEADER: {
    success: "Scheduled post published",
    partial: "Scheduled post partially published",
    failed: "Scheduled publish failed",
    skipped_no_credentials: "Scheduled publish skipped",
  },
  SLACK_EMOJI: {
    success: ":white_check_mark:",
    partial: ":warning:",
    failed: ":x:",
    skipped_no_credentials: ":fast_forward:",
  },
  SLACK_LABEL_AUTHOR: "Author",
  SLACK_LABEL_SCHEDULED: "Scheduled for",
  SLACK_LABEL_OUTCOME: "Outcome",
  SLACK_LABEL_PLATFORMS: "Platforms",
  SLACK_LABEL_SUCCEEDED: "Succeeded",
  SLACK_LABEL_FAILED: "Failed",
  SLACK_LABEL_PLATFORMS_SUMMARY: (ok: number, total: number) => `${ok} of ${total} succeeded`,
  SLACK_BUTTON_EDITOR: "Open in Editor",
  SLACK_BUTTON_DASHBOARD: "View Dashboard",
  SLACK_FOOTER: "SyncApp · Scheduled publish",
  EMAIL_CTA_EDITOR: "Open in Editor",
  EMAIL_CTA_DASHBOARD: "Go to Dashboard",
  OUTCOME_LABEL: {
    success: "Published successfully",
    partial: "Partially published",
    failed: "All platforms failed",
    skipped_no_credentials: "No connected platforms",
  },
  OUTCOME_COLOR: {
    success: "#22c55e",
    partial: "#f59e0b",
    failed: "#ef4444",
    skipped_no_credentials: "#64748b",
  },
} as const);

/** Every 12 hours — 00:00 and 12:00 UTC (05:30 and 17:30 IST). */
export const CRON_SCHEDULE = "0 */12 * * *";

export const SCHEDULED_PUBLISH_MAX_PER_RUN = 10;
