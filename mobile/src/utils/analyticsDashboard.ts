/**
 * Pure helpers to shape analytics API payloads for the mobile dashboard.
 */
import dayjs from "dayjs";

import {
  ANALYTICS_DATE_ISO_FORMAT,
  ANALYTICS_DATE_PRESETS,
  ANALYTICS_LABELS,
  ANALYTICS_PLATFORM_KEYS,
  ANALYTICS_TOP_POSTS_LIMIT,
} from "@constants/analytics";
import { PLATFORM_DISPLAY_NAMES, PLATFORMS } from "@constants/platforms";
import type {
  AnalyticsDailyActivity,
  AnalyticsDateRange,
  AnalyticsStats,
  ApiResponse,
  DevtoEngagementSummary,
  Ga4WebsiteAnalytics,
} from "@types";

/**
 * Convert axios/network rejections into `{ success: false }` so parallel
 * analytics fetches can settle independently.
 */
export async function settleAnalyticsRequest<T>(promise: Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  try {
    return await promise;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function createDefaultDateRange(days: number = ANALYTICS_DATE_PRESETS.DAYS_30): AnalyticsDateRange {
  const end = dayjs().format(ANALYTICS_DATE_ISO_FORMAT);
  const start = dayjs()
    .subtract(days - 1, "day")
    .format(ANALYTICS_DATE_ISO_FORMAT);
  return { start, end, presetDays: days };
}

export function filterHistoryByRange(
  history: AnalyticsDailyActivity[],
  range: AnalyticsDateRange,
): AnalyticsDailyActivity[] {
  const start = dayjs(range.start).startOf("day");
  const end = dayjs(range.end).endOf("day");
  return history.filter((row) => {
    const d = dayjs(row.date);
    return (d.isAfter(start) || d.isSame(start)) && (d.isBefore(end) || d.isSame(end));
  });
}

export function formatMetric(value: number | null | undefined, available: boolean): string {
  if (!available || value === null || value === undefined) {
    return ANALYTICS_LABELS.METRIC_UNAVAILABLE;
  }
  return value.toLocaleString();
}

export function buildPlatformPublishedRows(stats: AnalyticsStats | null) {
  return ANALYTICS_PLATFORM_KEYS.map((platform) => ({
    platform,
    label: PLATFORM_DISPLAY_NAMES[platform] ?? platform,
    publishedCount: stats?.platformStats[platform] ?? 0,
  }));
}

export function topEngagementPosts(engagement: DevtoEngagementSummary | null) {
  if (!engagement) return [];
  return [...engagement.posts].sort((a, b) => b.views - a.views).slice(0, ANALYTICS_TOP_POSTS_LIMIT);
}

export function websiteConfigured(website: Ga4WebsiteAnalytics | null): boolean {
  return Boolean(website?.configured);
}

export function engagementTotals(engagement: DevtoEngagementSummary | null) {
  return {
    views: engagement?.totalViews ?? null,
    reactions: engagement?.totalReactions ?? null,
    comments: engagement?.totalComments ?? null,
    engagementScore: engagement != null ? (engagement.totalReactions ?? 0) + (engagement.totalComments ?? 0) : null,
    articleCount: engagement?.articleCount ?? 0,
    lastSyncedAt: engagement?.lastSyncedAt ?? null,
    hasData: Boolean(engagement && engagement.articleCount > 0),
  };
}

export { PLATFORMS };
