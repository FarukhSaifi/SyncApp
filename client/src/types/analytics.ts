import type { Pagination } from "./api";
import type { Post } from "./models";

/**
 * Analytics and cache telemetry types.
 */

export interface PostsStats {
  total: number;
  published: number;
  drafts: number;
  withPlatforms: number;
}

export interface PostsCacheEntry {
  data: Post[];
  pagination: Pagination;
  timestamp: number;
}

export interface AnalyticsDailyActivity {
  date: string;
  posts: number;
  published: number;
}

export interface AnalyticsStats {
  summary: {
    totalPosts: number;
    totalPublished: number;
    totalDrafts: number;
    publishRate: number;
  };
  platformStats: {
    medium: number;
    devto: number;
    wordpress: number;
    linkedin: number;
  };
  history: AnalyticsDailyActivity[];
}

/** Latest DEV.to engagement snapshot summary from GET /api/analytics/engagement */
export interface EngagementPostRow {
  postId: string;
  title: string;
  slug?: string;
  remotePostId: string;
  url: string;
  views: number;
  reactions: number;
  comments: number;
  asOf: string;
  fetchedAt: string;
}

export interface DevtoEngagementSummary {
  platform: "devto";
  totalViews: number;
  totalReactions: number;
  totalComments: number;
  articleCount: number;
  lastSyncedAt: string | null;
  posts: EngagementPostRow[];
}

export interface DevtoEngagementSyncResult {
  synced: number;
  skipped: number;
  errors: Array<{ postId: string; error: string }>;
  summary: DevtoEngagementSummary;
}

export type AnalyticsDateRange = {
  start: string;
  end: string;
  presetDays: number | null;
};

export type AnalyticsMetricAvailability = "live" | "soon" | "empty";

export type AnalyticsOverviewCardModel = {
  id: string;
  label: string;
  value: string;
  hint: string;
  availability: AnalyticsMetricAvailability;
};

export type AnalyticsPlatformRowModel = {
  platform: string;
  label: string;
  publishedCount: number;
  views: number | null;
  reactions: number | null;
  comments: number | null;
  clicks: number | null;
  viewsAvailable: boolean;
  engagementAvailable: boolean;
  clicksAvailable: boolean;
};

export type AnalyticsTrafficSourceModel = {
  id: string;
  label: string;
  sessions: number | null;
  pageviews: number | null;
  available: boolean;
};

export type Ga4TrafficSourceRow = {
  id: string;
  source: string;
  medium: string;
  sessions: number;
  pageviews: number;
};

export type Ga4TopPageRow = {
  path: string;
  pageviews: number;
  sessions: number;
};

export type Ga4WebsiteAnalytics = {
  configured: boolean;
  setupRequired: boolean;
  message: string | null;
  propertyIdSet: boolean;
  credentialsAvailable: boolean;
  dateRange: { startDate: string; endDate: string };
  totals: {
    sessions: number;
    pageviews: number;
    activeUsers: number;
  };
  sources: Ga4TrafficSourceRow[];
  topPages: Ga4TopPageRow[];
};

/** Draft vs published slice for the status distribution pie chart. */
export type AnalyticsStatusChartDatum = {
  name: string;
  value: number;
};
