export type DevtoEngagementMetrics = {
  remotePostId: string;
  title: string;
  url: string;
  views: number;
  reactions: number;
  comments: number;
};

export type EngagementPostRow = {
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
};

export type DevtoEngagementSummary = {
  platform: "devto";
  totalViews: number;
  totalReactions: number;
  totalComments: number;
  articleCount: number;
  lastSyncedAt: string | null;
  posts: EngagementPostRow[];
};

export type DevtoEngagementSyncResult = {
  synced: number;
  skipped: number;
  errors: Array<{ postId: string; error: string }>;
  summary: DevtoEngagementSummary;
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
