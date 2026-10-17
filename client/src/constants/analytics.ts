import { INFO_MESSAGES, SYNC_LABEL } from "./messages";
import { PLATFORMS } from "./platforms";

/** Chart segment labels and dashboard copy for analytics views */
export const ANALYTICS_LABELS = Object.freeze({
  PAGE_TITLE: "Analytics",
  PAGE_DESCRIPTION: "Publishing activity, platform reach, and engagement across your posts.",
  PUBLISH_RATE: "Publish Rate",
  ACTIVE_PLATFORMS: "Active Platforms",
  DAILY_ACTIVITY_TITLE: "Publishing activity",
  DAILY_ACTIVITY_DESC: "Posts created and published in the selected range.",
  STATUS_DISTRIBUTION_TITLE: "Status Distribution",
  STATUS_DISTRIBUTION_DESC: "Ratio of drafts to published content.",
  PLATFORM_DISTRIBUTION_TITLE: "Platform Distribution",
  PLATFORM_DISTRIBUTION_DESC: "Destinations for your published content.",
  PLATFORM_BREAKDOWN_TITLE: "Per-platform performance",
  PLATFORM_BREAKDOWN_DESC: "Published posts plus engagement where SyncApp can sync it.",
  TOP_POSTS_TITLE: "Top posts by views",
  TOP_POSTS_DESC: "Highest DEV.to page views from the latest sync.",
  TRAFFIC_SOURCES_TITLE: "Traffic sources",
  TRAFFIC_SOURCES_DESC: "Blog sessions by channel from Google Analytics 4.",
  WEBSITE_TITLE: "Website (GA4)",
  WEBSITE_DESC: "Public blog sessions and pageviews for the selected range.",
  WEBSITE_SESSIONS: "Sessions",
  WEBSITE_PAGEVIEWS: "Pageviews",
  WEBSITE_USERS: "Active users",
  CHART_DRAFTS: INFO_MESSAGES["DRAFTS"],
  CHART_PUBLISHED: INFO_MESSAGES["PUBLISHED"],
  CHART_TOTAL_POSTS: INFO_MESSAGES["TOTAL_POSTS"],
  CARD_VIEWS: "Views",
  CARD_CLICKS: "Clicks",
  CARD_ENGAGEMENT: "Engagement",
  CARD_VIEWS_HINT: "DEV.to page views (synced)",
  CARD_CLICKS_HINT: "Blog pageviews from GA4",
  CARD_ENGAGEMENT_HINT: "Reactions + comments (DEV.to)",
  METRIC_PUBLISHED_POSTS: "Published posts",
  METRIC_VIEWS: "Views",
  METRIC_REACTIONS: "Reactions",
  METRIC_COMMENTS: "Comments",
  METRIC_CLICKS: "Clicks",
  METRIC_UNAVAILABLE: "—",
  COMING_SOON: "Coming soon",
  PHASE_BADGE_LIVE: "Live",
  PHASE_BADGE_SOON: "Soon",
  PHASE_BADGE_EMPTY: "Pending",
  TABLE_PLATFORM: "Platform",
  TABLE_POST: "Post",
  EMPTY_TOP_POSTS: "No DEV.to view data yet",
  EMPTY_TOP_POSTS_HINT: "Connect DEV.to and tap Refresh DEV.to after publishing.",
  EMPTY_TRAFFIC: "GA4 is not configured for the public blog yet.",
  EMPTY_TRAFFIC_HINT:
    "Create a GA4 property, install G-… on the blog, set GOOGLE_ANALYTICS_PROPERTY_ID, and grant the service account Viewer. See docs/GA4_SETUP.md.",
  EMPTY_ACTIVITY: "No publishing activity in this date range.",
  EMPTY_ENGAGEMENT: "Engagement not synced yet",
  EMPTY_WEBSITE: "No website analytics yet",
  EMPTY_STATUS_CHART: "No draft or published posts yet.",
  LAST_SYNCED: "Last synced",
  NEVER_SYNCED: "Not synced yet",
  REFRESH_ENGAGEMENT: "Refresh DEV.to",
  REFRESH_ALL: "Refresh",
  REFRESHING: "Syncing…",
  SETUP_GA4_TITLE: "Connect Google Analytics",
  GA4_LOAD_FAILED: "Failed to load website analytics",
  SOURCE_OTHER: "Other",
  DATE_RANGE_LABEL: "Date range",
  RANGE_7D: "7d",
  RANGE_30D: "30d",
  RANGE_90D: "90d",
  RANGE_CUSTOM: "Custom",
  RANGE_FROM: "From",
  RANGE_TO: "To",
  SERIES_CREATED: "Created",
  SERIES_PUBLISHED: "Published",
  OPEN_POST: "Open",
  OPEN_ON_DEVTO: "DEV.to",
  LEGEND_DRAFTS: "Drafts",
  LEGEND_PUBLISHED: "Published",
  PLATFORM_MEDIUM: SYNC_LABEL["PLATFORM_MEDIUM"],
  PLATFORM_DEVTO: SYNC_LABEL["PLATFORM_DEVTO"],
  PLATFORM_WORDPRESS: SYNC_LABEL["PLATFORM_WORDPRESS"],
  PLATFORM_LINKEDIN: SYNC_LABEL["PLATFORM_LINKEDIN"],
  SOURCE_GOOGLE_ORGANIC: "Google organic",
  SOURCE_LINKEDIN_REFERRALS: "LinkedIn referrals",
  SOURCE_DIRECT: "Direct",
  SOURCE_DEVTO_REFERRALS: "DEV.to referrals",
  LOAD_FAILED: "Failed to load analytics",
  LOAD_ERROR: "Error loading analytics",
  ENGAGEMENT_LOAD_FAILED: "Failed to load engagement",
  ENGAGEMENT_REFRESH_FAILED: "Failed to refresh DEV.to engagement",
  ENGAGEMENT_REFRESH_OK: "DEV.to engagement updated",
} as const);

/** Preset windows for the analytics date range picker (days inclusive of today). */
export const ANALYTICS_DATE_PRESETS = Object.freeze({
  DAYS_7: 7,
  DAYS_30: 30,
  DAYS_90: 90,
  /** Sentinel for custom date range mode (not a day count). */
  CUSTOM_VALUE: 0,
} as const);

export type AnalyticsDatePresetDays = (typeof ANALYTICS_DATE_PRESETS)[keyof typeof ANALYTICS_DATE_PRESETS];

export const ANALYTICS_DATE_PRESET_OPTIONS = Object.freeze([
  { days: ANALYTICS_DATE_PRESETS["DAYS_7"], labelKey: "RANGE_7D" as const },
  { days: ANALYTICS_DATE_PRESETS["DAYS_30"], labelKey: "RANGE_30D" as const },
  { days: ANALYTICS_DATE_PRESETS["DAYS_90"], labelKey: "RANGE_90D" as const },
]);

/** Date range field keys for custom From/To inputs. */
export const ANALYTICS_DATE_FIELDS = Object.freeze({
  START: "start",
  END: "end",
} as const);

/** dayjs format for analytics range ISO dates (API + date inputs). */
export const ANALYTICS_DATE_ISO_FORMAT = "YYYY-MM-DD";

/** Overview metric card ids (must match `buildOverviewCards`). */
export const ANALYTICS_OVERVIEW_CARD_IDS = Object.freeze({
  TOTAL_POSTS: "total_posts",
  PUBLISHED: "published",
  DRAFTS: "drafts",
  VIEWS: "views",
  CLICKS: "clicks",
  ENGAGEMENT: "engagement",
} as const);

/** Metric availability badge states. */
export const ANALYTICS_AVAILABILITY = Object.freeze({
  LIVE: "live",
  SOON: "soon",
  EMPTY: "empty",
} as const);

/** Traffic channel id for uncategorized GA4 sources. */
export const ANALYTICS_TRAFFIC_OTHER_ID = "other";

/** Recharts / table dataKey strings. */
export const ANALYTICS_CHART_KEYS = Object.freeze({
  DATE: "date",
  POSTS: "posts",
  PUBLISHED: "published",
  VALUE: "value",
  LABEL: "label",
  SESSIONS: "sessions",
} as const);

/** Platform row keys aligned with server `platformStats` + engagement. */
export const ANALYTICS_PLATFORM_KEYS = Object.freeze([
  PLATFORMS["DEVTO"],
  PLATFORMS["LINKEDIN"],
  PLATFORMS["MEDIUM"],
  PLATFORMS["WORDPRESS"],
] as const);

export type AnalyticsPlatformKey = (typeof ANALYTICS_PLATFORM_KEYS)[number];

export const ANALYTICS_PLATFORM_LABELS: Record<AnalyticsPlatformKey, string> = Object.freeze({
  [PLATFORMS["DEVTO"]]: SYNC_LABEL["PLATFORM_DEVTO"],
  [PLATFORMS["LINKEDIN"]]: SYNC_LABEL["PLATFORM_LINKEDIN"],
  [PLATFORMS["MEDIUM"]]: SYNC_LABEL["PLATFORM_MEDIUM"],
  [PLATFORMS["WORDPRESS"]]: SYNC_LABEL["PLATFORM_WORDPRESS"],
});

/** Which metrics each platform can show today vs placeholder. */
export const ANALYTICS_PLATFORM_CAPABILITY = Object.freeze({
  [PLATFORMS["DEVTO"]]: Object.freeze({
    publishedCount: true,
    views: true,
    reactions: true,
    comments: true,
    clicks: false,
  }),
  [PLATFORMS["LINKEDIN"]]: Object.freeze({
    publishedCount: true,
    views: false,
    reactions: false,
    comments: false,
    clicks: false,
  }),
  [PLATFORMS["MEDIUM"]]: Object.freeze({
    publishedCount: true,
    views: false,
    reactions: false,
    comments: false,
    clicks: false,
  }),
  [PLATFORMS["WORDPRESS"]]: Object.freeze({
    publishedCount: true,
    views: false,
    reactions: false,
    comments: false,
    clicks: false,
  }),
} as const);

/** Placeholder traffic channels until GA4 Data API (Phase 2). */
export const ANALYTICS_TRAFFIC_SOURCES = Object.freeze([
  { id: "google_organic", labelKey: "SOURCE_GOOGLE_ORGANIC" as const },
  { id: "linkedin", labelKey: "SOURCE_LINKEDIN_REFERRALS" as const },
  { id: "devto", labelKey: "SOURCE_DEVTO_REFERRALS" as const },
  { id: "direct", labelKey: "SOURCE_DIRECT" as const },
] as const);

/**
 * Theme-aware chart colors via CSS variables from `globals.css` (`:root` / `.dark`).
 * Prefer these over fixed hex so Recharts follow light/dark mode.
 */
export const ANALYTICS_CHART_COLORS = Object.freeze({
  PRIMARY: "hsl(var(--primary))",
  POSITIVE: "hsl(var(--positive))",
  WARNING: "hsl(var(--warning))",
  DESTRUCTIVE: "hsl(var(--destructive))",
  ACCENT: "hsl(var(--accent))",
  MUTED_FG: "hsl(var(--muted-foreground))",
  BORDER: "hsl(var(--border))",
  CARD: "hsl(var(--card))",
  FOREGROUND: "hsl(var(--foreground))",
  SERIES: [
    "hsl(var(--primary))",
    "hsl(var(--positive))",
    "hsl(var(--warning))",
    "hsl(var(--destructive))",
  ] as const,
} as const);

/**
 * Layout, sizing, chart, and Tailwind class-name tokens for the analytics dashboard.
 * String values use double quotes per coding standards.
 */
export const ANALYTICS_UI = Object.freeze({
  TOP_POSTS_LIMIT: 8,
  OVERVIEW_CARD_COUNT: 6,
  CHART_HEIGHT_PX: 300,
  CHART_HEIGHT_TABLET_PX: 260,
  CHART_HEIGHT_MOBILE_PX: 220,
  STATUS_CHART_HEIGHT_PX: 250,
  STATUS_CHART_HEIGHT_MOBILE_PX: 200,
  TRAFFIC_CHART_HEIGHT_PX: 220,
  TRAFFIC_CHART_HEIGHT_MOBILE_PX: 180,
  PLATFORM_CHART_HEIGHT_PX: 280,
  SKELETON_ACTIVITY_BARS: 12,
  SKELETON_ACTIVITY_BARS_MOBILE: 7,
  SKELETON_BAR_BASE_PCT: 20,
  SKELETON_BAR_STEP_PCT: 12,
  SKELETON_BAR_MOD: 5,
  Y_AXIS_WIDTH_MOBILE: 28,
  Y_AXIS_WIDTH_DESKTOP: 40,
  PIE_INNER_MOBILE: 44,
  PIE_OUTER_MOBILE: 64,
  PIE_INNER_DESKTOP: 60,
  PIE_OUTER_DESKTOP: 80,
  PIE_PADDING_ANGLE: 5,
  PIE_CENTER: "50%",
  CHART_FONT_SIZE: 12,
  CHART_FONT_SIZE_SM: 11,
  CHART_STROKE_WIDTH: 2,
  CHART_STROKE_DASH: "3 3",
  CHART_LINE_TYPE: "monotone",
  CHART_MIN_SIZE: 1,
  CHART_WIDTH_PCT: "100%",
  CHART_HEIGHT_PCT: "100%",
  BAR_RADIUS: [4, 4, 0, 0] as const,
  TOOLTIP_BORDER_RADIUS_PX: 8,
  GRID_STROKE_VERTICAL: false,
  TABLE_PLATFORM_MIN_WIDTH_CLASS: "min-w-[480px]",
  TABLE_TOP_POSTS_MIN_WIDTH_CLASS: "min-w-[420px]",
  TITLE_CELL_CLASS: "max-w-[140px] sm:max-w-[220px] truncate",
  LINK_TARGET_BLANK: "_blank",
  LINK_REL: "noopener noreferrer",
  INPUT_TYPE_DATE: "date",
  DATE_FIELD_START: "start",
  DATE_FIELD_END: "end",
  PAGE_ROOT: "min-w-0 max-w-full space-y-4 overflow-x-hidden px-1 sm:space-y-6 sm:px-0",
  PAGE_LOADING_ROOT: "space-y-4 sm:space-y-6 px-1 sm:px-0",
  HEADER_ROW: "flex min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between",
  HEADER_TITLE: "text-2xl font-bold text-foreground sm:text-3xl",
  HEADER_DESC: "mt-2 text-sm text-muted-foreground sm:text-base",
  HEADER_ACTIONS: "flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0",
  ACTION_BTN: "min-h-[44px] flex-1 touch-manipulation sm:min-h-0 sm:flex-none",
  ICON_SM: "h-3.5 w-3.5 shrink-0 text-muted-foreground",
  ICON_MD: "h-4 w-4 shrink-0 text-muted-foreground",
  ICON_REFRESH_SPIN: "mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin",
  ICON_REFRESH: "mr-1.5 h-3.5 w-3.5 shrink-0",
  OVERVIEW_GRID: "grid min-w-0 grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6",
  OVERVIEW_GRID_SKELETON: "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6",
  CARD_SURFACE:
    "min-w-0 overflow-hidden border border-border/80 bg-card shadow-sm transition-shadow duration-200 hover:shadow-md",
  CARD_OVERFLOW: "min-w-0 overflow-hidden",
  CARD_HEADER_OVERVIEW: "min-w-0 space-y-2 overflow-hidden pb-2",
  CARD_HEADER_ROW: "flex min-w-0 items-start justify-between gap-2",
  CARD_LABEL_ROW: "flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden",
  CARD_LABEL_TEXT: "truncate text-muted-foreground",
  CARD_VALUE: "mt-0 truncate text-xl font-semibold text-foreground sm:text-2xl",
  CARD_HINT: "line-clamp-2 text-[11px] leading-snug text-muted-foreground",
  BADGE_BASE:
    "inline-flex max-w-full shrink-0 items-center truncate rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none",
  BADGE_LIVE: "border-positive/40 bg-positive/15 text-positive",
  BADGE_SOON: "border-border bg-muted text-muted-foreground",
  BADGE_EMPTY: "border-border bg-muted text-muted-foreground",
  SECTION_GRID: "grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2",
  SECTION_SPAN_FULL: "col-span-1 lg:col-span-2",
  CHART_EMPTY: "flex h-full items-center justify-center text-sm text-muted-foreground",
  CHART_ACTIVITY: "h-[220px] sm:h-[260px] md:h-[300px]",
  CHART_STATUS: "flex h-[200px] justify-center sm:h-[250px]",
  META_SYNC: "mt-3 text-[11px] text-muted-foreground",
  SCROLL_X: "min-w-0 overflow-x-auto",
  WEBSITE_METRICS_GRID: "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3",
  WEBSITE_METRIC_CARD: "min-w-0 overflow-hidden rounded-lg border border-border bg-muted/20 p-3",
  WEBSITE_METRIC_LABEL: "truncate text-[11px] uppercase tracking-wide text-muted-foreground",
  WEBSITE_METRIC_VALUE: "truncate text-lg font-semibold text-foreground sm:text-xl",
  TRAFFIC_TITLE: "mb-2 text-sm font-medium text-foreground",
  LINK_DEVTO:
    "inline-flex min-h-[44px] items-center gap-1 text-xs text-primary touch-manipulation hover:underline sm:min-h-0",
  TITLE_PLATFORM_ROW: "flex items-center gap-2 text-foreground",
  ALERT_INFO: "rounded-lg border border-accent/30 bg-accent/10 p-3 text-foreground",
  ALERT_WARNING: "rounded-lg border border-warning/40 bg-warning/10 p-3 text-foreground",
  ALERT_TITLE: "font-medium text-foreground",
  ALERT_BODY: "mt-1 text-sm text-muted-foreground",
  DATE_CARD_HEADER: "pb-3",
  DATE_CARD_TITLE: "text-base text-foreground",
  DATE_CARD_BODY: "flex min-w-0 flex-col gap-3",
  PRESET_GROUP: "flex w-full flex-wrap gap-2",
  PRESET_BTN:
    "min-h-[44px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground touch-manipulation transition-colors hover:bg-primary/10 hover:text-foreground sm:min-h-0 sm:flex-none sm:text-sm",
  PRESET_BTN_ACTIVE: "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
  DATE_FIELDS_ROW: "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2",
  TOUCH_TARGET: "min-h-[44px] touch-manipulation",
  TABLE_HEAD_RIGHT: "text-right",
  TABLE_CELL_RIGHT: "text-right tabular-nums",
  TABLE_CELL_NOWRAP: "whitespace-nowrap",
  PLATFORM_MOBILE_LIST: "space-y-3 md:hidden",
  PLATFORM_MOBILE_CARD: "rounded-lg border border-border bg-muted/20 p-3 space-y-2",
  PLATFORM_MOBILE_TITLE: "truncate text-sm font-medium text-foreground",
  PLATFORM_MOBILE_METRICS: "grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3",
  PLATFORM_DESKTOP_TABLE: "hidden md:block",
  TOP_POSTS_MOBILE_LIST: "space-y-3 md:hidden",
  TOP_POSTS_DESKTOP_TABLE: "hidden md:block",
  SKELETON_TITLE: "h-8 w-40 sm:h-9",
  SKELETON_DESC: "mt-2 h-4 w-72 sm:w-96",
  SKELETON_CHIP: "h-3 w-16",
  SKELETON_VALUE: "mt-2 h-7 w-12",
  SKELETON_CHART_TITLE: "h-5 w-48",
  SKELETON_CHART_BODY: "flex h-[300px] items-end gap-2 px-6 pb-6",
  SKELETON_BAR: "w-full rounded-t bg-muted/40",
  OVERVIEW_SKEL_KEY_PREFIX: "overview-skel-",
  ACTIVITY_SKEL_KEY_PREFIX: "activity-skel-",
} as const);

/** Semantic accent classes for key metric values (views / reactions / comments / clicks). */
export const ANALYTICS_METRIC_ACCENT = Object.freeze({
  views: "text-primary",
  reactions: "text-warning",
  comments: "text-accent",
  clicks: "text-positive",
  engagement: "text-primary",
  default: "text-foreground",
} as const);

export type AnalyticsMetricAccentKey = keyof typeof ANALYTICS_METRIC_ACCENT;
