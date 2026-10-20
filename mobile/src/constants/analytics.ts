import { PLATFORMS } from "./platforms";

/** Chart / dashboard copy for mobile analytics (aligned with web). */
export const ANALYTICS_LABELS = Object.freeze({
  PAGE_DESCRIPTION: "Publishing activity, platform reach, and engagement across your posts.",
  VIEWS: "Views",
  CLICKS: "Clicks",
  ENGAGEMENT: "Engagement",
  VIEWS_HINT: "DEV.to page views (synced)",
  CLICKS_HINT: "Blog pageviews from GA4",
  ENGAGEMENT_HINT: "Reactions + comments (DEV.to)",
  METRIC_UNAVAILABLE: "—",
  TOP_POSTS: "Top posts by views",
  TOP_POSTS_HINT: "Highest DEV.to page views from the latest sync.",
  EMPTY_TOP_POSTS: "No DEV.to view data yet",
  EMPTY_TOP_POSTS_HINT: "Connect DEV.to and tap Refresh DEV.to after publishing.",
  WEBSITE_TITLE: "Website (GA4)",
  WEBSITE_DESC: "Public blog sessions and pageviews for the selected range.",
  WEBSITE_SESSIONS: "Sessions",
  WEBSITE_PAGEVIEWS: "Pageviews",
  WEBSITE_USERS: "Active users",
  EMPTY_TRAFFIC: "GA4 is not configured for the public blog yet.",
  EMPTY_TRAFFIC_HINT:
    "Set GOOGLE_ANALYTICS_PROPERTY_ID on the server and grant the service account Viewer. See docs/GA4_SETUP.md.",
  EMPTY_ACTIVITY: "No publishing activity in this date range.",
  LAST_SYNCED: "Last synced",
  NEVER_SYNCED: "Not synced yet",
  REFRESH_ENGAGEMENT: "Refresh DEV.to",
  REFRESH_ALL: "Refresh",
  REFRESHING: "Syncing…",
  ADMIN_ONLY_GA4: "Website analytics (GA4) is available to admins.",
  RANGE_7D: "7d",
  RANGE_30D: "30d",
  RANGE_90D: "90d",
  DATE_RANGE: "Date range",
  PLATFORM_BREAKDOWN: "Per-platform published",
  LOAD_FAILED: "Failed to load analytics",
  LOAD_ERROR: "Error loading analytics",
  ENGAGEMENT_LOAD_FAILED: "Failed to load engagement",
  ENGAGEMENT_REFRESH_FAILED: "Failed to refresh DEV.to engagement",
  ENGAGEMENT_REFRESH_OK: "DEV.to engagement updated",
  GA4_LOAD_FAILED: "Failed to load website analytics",
  SERIES_CREATED: "Created",
  SERIES_PUBLISHED: "Published",
} as const);

export const ANALYTICS_DATE_PRESETS = Object.freeze({
  DAYS_7: 7,
  DAYS_30: 30,
  DAYS_90: 90,
} as const);

export const ANALYTICS_DATE_PRESET_OPTIONS = Object.freeze([
  { days: ANALYTICS_DATE_PRESETS.DAYS_7, label: ANALYTICS_LABELS.RANGE_7D },
  { days: ANALYTICS_DATE_PRESETS.DAYS_30, label: ANALYTICS_LABELS.RANGE_30D },
  { days: ANALYTICS_DATE_PRESETS.DAYS_90, label: ANALYTICS_LABELS.RANGE_90D },
]);

export const ANALYTICS_DATE_ISO_FORMAT = "YYYY-MM-DD";

export const ANALYTICS_TOP_POSTS_LIMIT = 8;

export const ANALYTICS_PLATFORM_KEYS = Object.freeze([
  PLATFORMS.DEVTO,
  PLATFORMS.LINKEDIN,
  PLATFORMS.MEDIUM,
  PLATFORMS.WORDPRESS,
] as const);
