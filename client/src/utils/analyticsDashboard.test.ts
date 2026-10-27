import { describe, expect, it } from "vitest";

import { ANALYTICS_DATE_PRESETS } from "@constants/analytics";

import {
  buildOverviewCards,
  buildPlatformRows,
  buildTrafficSources,
  createDefaultDateRange,
  filterHistoryByRange,
  settleAnalyticsRequest,
  topEngagementPosts,
} from "./analyticsDashboard";

describe("analyticsDashboard helpers", () => {
  it("createDefaultDateRange spans preset days inclusive", () => {
    const range = createDefaultDateRange(ANALYTICS_DATE_PRESETS["DAYS_7"]);
    expect(range.start <= range.end).toBe(true);
    expect(range.presetDays).toBe(ANALYTICS_DATE_PRESETS["DAYS_7"]);
  });

  it("filterHistoryByRange keeps rows inside range", () => {
    const history = [
      { date: "2024-01-01", posts: 1, published: 0 },
      { date: "2024-06-01", posts: 2, published: 1 },
    ];
    const filtered = filterHistoryByRange(history, { start: "2024-05-01", end: "2024-06-30", presetDays: 30 });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.date).toBe("2024-06-01");
  });

  it("settleAnalyticsRequest returns failure envelope on reject", async () => {
    const result = await settleAnalyticsRequest(Promise.reject(new Error("network down")));
    expect(result.success).toBe(false);
    expect(result.error).toContain("network down");
  });

  it("buildOverviewCards merges stats, engagement, and GA4", () => {
    const cards = buildOverviewCards(
      {
        summary: { totalPosts: 10, totalPublished: 4, totalDrafts: 6, publishRate: 0.4 },
        platformStats: { medium: 0, devto: 1, wordpress: 0, linkedin: 0 },
        history: [],
      },
      {
        platform: "devto",
        totalViews: 100,
        totalReactions: 5,
        totalComments: 2,
        articleCount: 2,
        lastSyncedAt: null,
        posts: [],
      },
      {
        configured: true,
        setupRequired: false,
        message: null,
        propertyIdSet: true,
        credentialsAvailable: true,
        dateRange: { startDate: "2024-01-01", endDate: "2024-01-31" },
        totals: { pageviews: 50, sessions: 10, activeUsers: 4 },
        sources: [],
        topPages: [],
      },
    );
    expect(cards.length).toBeGreaterThan(4);
    expect(cards.some((c) => c.value.includes("10"))).toBe(true);
  });

  it("buildPlatformRows and traffic sources handle missing analytics", () => {
    const rows = buildPlatformRows(null, null);
    expect(rows.length).toBeGreaterThan(0);
    const traffic = buildTrafficSources(null);
    expect(traffic.every((t) => t.available === false)).toBe(true);
  });

  it("topEngagementPosts sorts by views", () => {
    const posts = topEngagementPosts({
      platform: "devto",
      totalViews: 10,
      totalReactions: 0,
      totalComments: 0,
      articleCount: 2,
      lastSyncedAt: null,
      posts: [
        {
          postId: "a",
          title: "A",
          remotePostId: "ra",
          url: "https://dev.to/a",
          views: 1,
          reactions: 0,
          comments: 0,
          asOf: "2024-01-01",
          fetchedAt: "2024-01-01",
        },
        {
          postId: "b",
          title: "B",
          remotePostId: "rb",
          url: "https://dev.to/b",
          views: 99,
          reactions: 0,
          comments: 0,
          asOf: "2024-01-01",
          fetchedAt: "2024-01-01",
        },
      ],
    });
    expect(posts[0]?.postId).toBe("b");
  });
});
