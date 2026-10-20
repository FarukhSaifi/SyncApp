/**
 * Pure helpers to shape analytics API payloads for the dashboard UI.
 */
import type {
  AnalyticsDailyActivity,
  AnalyticsDateRange,
  AnalyticsOverviewCardModel,
  AnalyticsPlatformRowModel,
  AnalyticsStats,
  AnalyticsTrafficSourceModel,
  ApiResponse,
  DevtoEngagementSummary,
  Ga4WebsiteAnalytics,
} from "@types";
import dayjs from "dayjs";

/**
 * Convert axios/network rejections into `{ success: false }` so parallel
 * analytics fetches can settle independently (one platform failure must not
 * blank the whole dashboard).
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

import {
  ANALYTICS_AVAILABILITY,
  ANALYTICS_DATE_ISO_FORMAT,
  ANALYTICS_DATE_PRESETS,
  ANALYTICS_LABELS,
  ANALYTICS_OVERVIEW_CARD_IDS,
  ANALYTICS_PLATFORM_CAPABILITY,
  ANALYTICS_PLATFORM_KEYS,
  ANALYTICS_PLATFORM_LABELS,
  ANALYTICS_TRAFFIC_OTHER_ID,
  ANALYTICS_TRAFFIC_SOURCES,
  ANALYTICS_UI,
  type AnalyticsPlatformKey,
} from "@constants/analytics";
import { PLATFORMS } from "@constants/platforms";

export function createDefaultDateRange(days: number = ANALYTICS_DATE_PRESETS["DAYS_30"]): AnalyticsDateRange {
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

export function buildOverviewCards(
  stats: AnalyticsStats | null,
  engagement: DevtoEngagementSummary | null,
  website: Ga4WebsiteAnalytics | null,
): AnalyticsOverviewCardModel[] {
  const totalViews = engagement?.totalViews ?? 0;
  const totalEngagement = (engagement?.totalReactions ?? 0) + (engagement?.totalComments ?? 0);
  const pageviews = website?.configured ? website.totals.pageviews : null;

  return [
    {
      id: ANALYTICS_OVERVIEW_CARD_IDS["TOTAL_POSTS"],
      label: ANALYTICS_LABELS["CHART_TOTAL_POSTS"],
      value: String(stats?.summary.totalPosts ?? 0),
      hint: ANALYTICS_LABELS["PHASE_BADGE_LIVE"],
      availability: ANALYTICS_AVAILABILITY["LIVE"],
    },
    {
      id: ANALYTICS_OVERVIEW_CARD_IDS["PUBLISHED"],
      label: ANALYTICS_LABELS["CHART_PUBLISHED"],
      value: String(stats?.summary.totalPublished ?? 0),
      hint: ANALYTICS_LABELS["PHASE_BADGE_LIVE"],
      availability: ANALYTICS_AVAILABILITY["LIVE"],
    },
    {
      id: ANALYTICS_OVERVIEW_CARD_IDS["DRAFTS"],
      label: ANALYTICS_LABELS["CHART_DRAFTS"],
      value: String(stats?.summary.totalDrafts ?? 0),
      hint: ANALYTICS_LABELS["PHASE_BADGE_LIVE"],
      availability: ANALYTICS_AVAILABILITY["LIVE"],
    },
    {
      id: ANALYTICS_OVERVIEW_CARD_IDS["VIEWS"],
      label: ANALYTICS_LABELS["CARD_VIEWS"],
      value: engagement ? totalViews.toLocaleString() : ANALYTICS_LABELS["METRIC_UNAVAILABLE"],
      hint: ANALYTICS_LABELS["CARD_VIEWS_HINT"],
      availability:
        engagement && engagement.articleCount > 0 ? ANALYTICS_AVAILABILITY["LIVE"] : ANALYTICS_AVAILABILITY["EMPTY"],
    },
    {
      id: ANALYTICS_OVERVIEW_CARD_IDS["CLICKS"],
      label: ANALYTICS_LABELS["CARD_CLICKS"],
      value: pageviews !== null ? pageviews.toLocaleString() : ANALYTICS_LABELS["METRIC_UNAVAILABLE"],
      hint: ANALYTICS_LABELS["CARD_CLICKS_HINT"],
      availability: website?.configured ? ANALYTICS_AVAILABILITY["LIVE"] : ANALYTICS_AVAILABILITY["SOON"],
    },
    {
      id: ANALYTICS_OVERVIEW_CARD_IDS["ENGAGEMENT"],
      label: ANALYTICS_LABELS["CARD_ENGAGEMENT"],
      value: engagement ? totalEngagement.toLocaleString() : ANALYTICS_LABELS["METRIC_UNAVAILABLE"],
      hint: ANALYTICS_LABELS["CARD_ENGAGEMENT_HINT"],
      availability:
        engagement && engagement.articleCount > 0 ? ANALYTICS_AVAILABILITY["LIVE"] : ANALYTICS_AVAILABILITY["EMPTY"],
    },
  ];
}

export function buildPlatformRows(
  stats: AnalyticsStats | null,
  engagement: DevtoEngagementSummary | null,
): AnalyticsPlatformRowModel[] {
  return ANALYTICS_PLATFORM_KEYS.map((platform: AnalyticsPlatformKey) => {
    const capability = ANALYTICS_PLATFORM_CAPABILITY[platform];
    const publishedCount = stats?.platformStats[platform] ?? 0;
    const isDevto = platform === PLATFORMS["DEVTO"];

    return {
      platform,
      label: ANALYTICS_PLATFORM_LABELS[platform],
      publishedCount,
      views: isDevto && capability.views ? (engagement?.totalViews ?? 0) : null,
      reactions: isDevto && capability.reactions ? (engagement?.totalReactions ?? 0) : null,
      comments: isDevto && capability.comments ? (engagement?.totalComments ?? 0) : null,
      clicks: null,
      viewsAvailable: capability.views,
      engagementAvailable: capability.reactions || capability.comments,
      clicksAvailable: capability.clicks,
    };
  });
}

export function buildTrafficSources(website: Ga4WebsiteAnalytics | null): AnalyticsTrafficSourceModel[] {
  if (!website?.configured) {
    return ANALYTICS_TRAFFIC_SOURCES.map((src) => ({
      id: src.id,
      label: ANALYTICS_LABELS[src.labelKey],
      sessions: null,
      pageviews: null,
      available: false,
    }));
  }

  const byId = new Map(website.sources.map((s) => [s.id, s]));
  const known: AnalyticsTrafficSourceModel[] = ANALYTICS_TRAFFIC_SOURCES.map((src) => {
    const hit = byId.get(src.id);
    return {
      id: src.id,
      label: ANALYTICS_LABELS[src.labelKey],
      sessions: hit?.sessions ?? 0,
      pageviews: hit?.pageviews ?? 0,
      available: true,
    };
  });

  const other = byId.get(ANALYTICS_TRAFFIC_OTHER_ID);
  if (other && other.sessions > 0) {
    known.push({
      id: ANALYTICS_TRAFFIC_OTHER_ID,
      label: ANALYTICS_LABELS["SOURCE_OTHER"],
      sessions: other.sessions,
      pageviews: other.pageviews,
      available: true,
    });
  }

  return known;
}

export function topEngagementPosts(engagement: DevtoEngagementSummary | null) {
  if (!engagement) {
    return [];
  }
  return [...engagement.posts].sort((a, b) => b.views - a.views).slice(0, ANALYTICS_UI["TOP_POSTS_LIMIT"]);
}
