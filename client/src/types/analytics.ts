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
