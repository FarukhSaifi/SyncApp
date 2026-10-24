/**
 * Analytics / engagement sync constants (DEV.to + GA4).
 * See docs/ANALYTICS_PLAN.md and docs/GA4_SETUP.md.
 */
export const ANALYTICS_PLATFORMS = Object.freeze({
  DEVTO: "devto",
} as const);

export type AnalyticsPlatform = (typeof ANALYTICS_PLATFORMS)[keyof typeof ANALYTICS_PLATFORMS];

export const ANALYTICS_SYNC = Object.freeze({
  /** Max published DEV.to posts to refresh per sync request. */
  DEVTO_MAX_POSTS_PER_SYNC: 50,
  /** Page size when listing authenticated /articles/me. */
  DEVTO_ME_PER_PAGE: 100,
  /** Max pages to walk on /articles/me. */
  DEVTO_ME_MAX_PAGES: 5,
  /** Delay between individual article fetches when /me misses an id (ms). */
  DEVTO_FETCH_GAP_MS: 80,
  USER_AGENT: "SyncApp/1.0 (+analytics)",
  /** Default lookback when the client omits start/end. */
  GA4_DEFAULT_DAYS: 30,
  GA4_MAX_SOURCE_ROWS: 50,
  GA4_MAX_PAGE_ROWS: 25,
  GA4_SCOPE: "https://www.googleapis.com/auth/analytics.readonly",
} as const);

/** Dashboard traffic channel ids returned by GA4 aggregation. */
export const GA4_TRAFFIC_CHANNELS = Object.freeze({
  GOOGLE_ORGANIC: "google_organic",
  LINKEDIN: "linkedin",
  DEVTO: "devto",
  DIRECT: "direct",
  OTHER: "other",
} as const);

export type Ga4TrafficChannelId = (typeof GA4_TRAFFIC_CHANNELS)[keyof typeof GA4_TRAFFIC_CHANNELS];

/** Map sessionSource (lowercase) → dashboard traffic channel id. */
export const GA4_SOURCE_CHANNEL_MAP = Object.freeze({
  google: GA4_TRAFFIC_CHANNELS.GOOGLE_ORGANIC,
  bing: GA4_TRAFFIC_CHANNELS.GOOGLE_ORGANIC,
  yahoo: GA4_TRAFFIC_CHANNELS.GOOGLE_ORGANIC,
  linkedin: GA4_TRAFFIC_CHANNELS.LINKEDIN,
  "lnkd.in": GA4_TRAFFIC_CHANNELS.LINKEDIN,
  "dev.to": GA4_TRAFFIC_CHANNELS.DEVTO,
  devto: GA4_TRAFFIC_CHANNELS.DEVTO,
  "(direct)": GA4_TRAFFIC_CHANNELS.DIRECT,
} as const);

/** GA4 Data API report field names, defaults, and source-matching helpers. */
export const GA4_REPORT = Object.freeze({
  LOGGER_NAME: "GA4_ANALYTICS",
  DATE_FORMAT: "YYYY-MM-DD",
  DAY_UNIT: "day",
  /** Inclusive lookback: subtract (days - offset) from end date. */
  INCLUSIVE_DAY_OFFSET: 1,
  PROPERTY_PATH_PREFIX: "properties/",
  EMPTY_PATH: "/",
  EMPTY_METRIC: 0,
  /** Metric index order for totals report. */
  TOTALS_METRIC_SESSIONS: 0,
  TOTALS_METRIC_PAGEVIEWS: 1,
  TOTALS_METRIC_ACTIVE_USERS: 2,
  /** Metric index order for sources / pages reports. */
  ROW_METRIC_PRIMARY: 0,
  ROW_METRIC_SECONDARY: 1,
  DIMENSION_SOURCE: 0,
  DIMENSION_MEDIUM: 1,
  DIMENSION_PATH: 0,
  METRICS: {
    SESSIONS: "sessions",
    SCREEN_PAGE_VIEWS: "screenPageViews",
    ACTIVE_USERS: "activeUsers",
  },
  DIMENSIONS: {
    SESSION_SOURCE: "sessionSource",
    SESSION_MEDIUM: "sessionMedium",
    PAGE_PATH: "pagePath",
  },
  /** GA4 reserved source/medium sentinel values. */
  SOURCE_DIRECT: "(direct)",
  MEDIUM_NONE: "(none)",
  MEDIUM_NOT_SET: "(not set)",
  MEDIUM_ORGANIC: "organic",
  /** Substrings used when GA4_SOURCE_CHANNEL_MAP misses a source. */
  SOURCE_INCLUDES_LINKEDIN: "linkedin",
  SOURCE_INCLUDES_LNKD: "lnkd",
  SOURCE_INCLUDES_DEV_TO: "dev.to",
  SOURCE_INCLUDES_DEVTO: "devto",
  RUN_REPORT_FAILED_LOG_PREFIX: "GA4 runReport failed: ",
} as const);

export const GA4_EMPTY_TOTALS = Object.freeze({
  sessions: 0,
  pageviews: 0,
  activeUsers: 0,
} as const);
