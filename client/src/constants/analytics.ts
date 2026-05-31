import { INFO_MESSAGES, SYNC_LABEL } from "./messages";
import { POST_STATUS } from "./postStatus";

/** Chart segment labels for analytics views */
export const ANALYTICS_LABELS = Object.freeze({
  PAGE_TITLE: "Analytics",
  PAGE_DESCRIPTION: "Insights into your publishing activity and performance.",
  PUBLISH_RATE: "Publish Rate",
  ACTIVE_PLATFORMS: "Active Platforms",
  DAILY_ACTIVITY_TITLE: "Daily Activity (30 Days)",
  DAILY_ACTIVITY_DESC: "Number of posts created and published over time.",
  STATUS_DISTRIBUTION_TITLE: "Status Distribution",
  STATUS_DISTRIBUTION_DESC: "Ratio of drafts to published content.",
  PLATFORM_DISTRIBUTION_TITLE: "Platform Distribution",
  PLATFORM_DISTRIBUTION_DESC: "Destinations for your published content.",
  CHART_DRAFTS: INFO_MESSAGES.DRAFTS,
  CHART_PUBLISHED: INFO_MESSAGES.PUBLISHED,
  CHART_TOTAL_POSTS: INFO_MESSAGES.TOTAL_POSTS,
  PLATFORM_MEDIUM: SYNC_LABEL.PLATFORM_MEDIUM,
  PLATFORM_DEVTO: SYNC_LABEL.PLATFORM_DEVTO,
  PLATFORM_WORDPRESS: SYNC_LABEL.PLATFORM_WORDPRESS,
  LOAD_FAILED: "Failed to load analytics",
  LOAD_ERROR: "Error loading analytics",
} as const);

/** Status keys used in analytics pie charts */
export const ANALYTICS_STATUS_KEYS = Object.freeze({
  DRAFTS: POST_STATUS.DRAFT,
  PUBLISHED: POST_STATUS.PUBLISHED,
} as const);
