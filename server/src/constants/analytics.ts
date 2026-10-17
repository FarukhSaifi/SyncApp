/**
 * Analytics / engagement sync constants (DEV.to + GA4).
 * See docs/ANALYTICS_PLAN.md and docs/GA4_SETUP.md.
 */
export const ANALYTICS_PLATFORMS = Object.freeze({
  DEVTO: "devto",
} as const);

export type AnalyticsPlatform = (typeof ANALYTICS_PLATFORMS)[keyof typeof ANALYTICS_PLATFORMS];

export const ANALYTICS_ENV = Object.freeze({
  /** Numeric GA4 property id (Admin → Property settings), not the G-XXXXXXXX measurement id. */
  PROPERTY_ID: "GOOGLE_ANALYTICS_PROPERTY_ID",
} as const);

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

/** Map sessionSource (lowercase) → dashboard traffic channel id. */
export const GA4_SOURCE_CHANNEL_MAP = Object.freeze({
  google: "google_organic",
  bing: "google_organic",
  yahoo: "google_organic",
  linkedin: "linkedin",
  "lnkd.in": "linkedin",
  "dev.to": "devto",
  devto: "devto",
  "(direct)": "direct",
} as const);

export type Ga4TrafficChannelId = "google_organic" | "linkedin" | "devto" | "direct" | "other";
