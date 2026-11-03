import { beforeEach, describe, expect, it, vi } from "vitest";

const analyticsMocks = vi.hoisted(() => ({
  getAnalyticsSummary: vi.fn(async () => ({
    summary: { totalPosts: 1, totalPublished: 0, totalDrafts: 1, publishRate: 0 },
    platformStats: { medium: 0, devto: 0, wordpress: 0, linkedin: 0 },
    history: [],
  })),
  getDevtoEngagementSummary: vi.fn(async () => ({
    platform: "devto",
    totalViews: 5,
    articleCount: 1,
    posts: [],
  })),
  syncDevtoEngagement: vi.fn(async () => ({ synced: 2, skipped: 0, errors: [], summary: {} })),
  getWebsiteAnalytics: vi.fn(async () => ({ configured: true, totals: { sessions: 1 } })),
}));

vi.mock("@services/analyticsService", () => ({
  getAnalyticsSummary: analyticsMocks.getAnalyticsSummary,
}));

vi.mock("@services/devtoEngagementService", () => ({
  getDevtoEngagementSummary: analyticsMocks.getDevtoEngagementSummary,
  syncDevtoEngagement: analyticsMocks.syncDevtoEngagement,
}));

vi.mock("@services/ga4AnalyticsService", () => ({
  getWebsiteAnalytics: analyticsMocks.getWebsiteAnalytics,
}));

import { getEngagement, getStats, getWebsiteAnalytics, refreshEngagement } from "./analyticsController";

async function runHandler(
  handler: (req: unknown, res: unknown, next: (err?: unknown) => void) => void,
  req: unknown,
  res: { json: ReturnType<typeof vi.fn>; status: ReturnType<typeof vi.fn> },
): Promise<void> {
  handler(req, res, vi.fn());
  await vi.waitFor(() => expect(res.json).toHaveBeenCalled(), { timeout: 2000 });
}

describe("analyticsController", () => {
  const userId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getStats returns analytics summary", async () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await runHandler(getStats as never, { userId }, { json, status });
    expect(analyticsMocks.getAnalyticsSummary).toHaveBeenCalledWith(userId);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Object) }));
  });

  it("getEngagement returns DEV.to snapshot summary", async () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await runHandler(getEngagement as never, { userId }, { json, status });
    expect(analyticsMocks.getDevtoEngagementSummary).toHaveBeenCalledWith(userId);
    expect(status).toHaveBeenCalledWith(200);
  });

  it("refreshEngagement syncs and returns message", async () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await runHandler(refreshEngagement as never, { userId }, { json, status });
    expect(analyticsMocks.syncDevtoEngagement).toHaveBeenCalledWith(userId);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: expect.any(String) }));
  });

  it("getWebsiteAnalytics forwards date query params", async () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await runHandler(
      getWebsiteAnalytics as never,
      { query: { startDate: "2026-01-01", endDate: "2026-01-31" } },
      { json, status },
    );
    expect(analyticsMocks.getWebsiteAnalytics).toHaveBeenCalledWith({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
  });
});
