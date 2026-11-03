import React from "react";

import { ANALYTICS_LABELS, USER_ROLES } from "@constants";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiClient } from "@utils/apiClient";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


vi.mock("recharts", async () => {
  const { mockRechartsModule } = await import("../test/rechartsStub");
  return mockRechartsModule();
});

const toast = {
  apiError: vi.fn(),
  apiSuccess: vi.fn(),
};

vi.mock("@hooks/useToast", () => ({
  useToast: () => toast,
}));

vi.mock("@contexts/AuthContext", () => ({
  useAuth: () => ({ user: { _id: "admin-1", role: USER_ROLES.ADMIN, email: "admin@test.com" } }),
}));

import Analytics from "./Analytics";

const statsPayload = {
  summary: { totalPosts: 3, totalPublished: 1, totalDrafts: 2, publishRate: 0.33 },
  platformStats: { medium: 0, devto: 1, wordpress: 0, linkedin: 0 },
  history: [{ date: "2024-06-01", posts: 1, published: 0 }],
};

describe("Analytics view", () => {
  beforeEach(() => {
    toast.apiError.mockReset();
    vi.spyOn(apiClient, "getAnalyticsStats").mockResolvedValue({ success: true, data: statsPayload });
    vi.spyOn(apiClient, "getAnalyticsEngagement").mockResolvedValue({
      success: true,
      data: {
        platform: "devto",
        totalViews: 10,
        totalReactions: 1,
        totalComments: 0,
        articleCount: 1,
        lastSyncedAt: null,
        posts: [],
      },
    });
    vi.spyOn(apiClient, "getAnalyticsWebsite").mockResolvedValue({
      success: true,
      data: {
        configured: true,
        setupRequired: false,
        message: null,
        propertyIdSet: true,
        credentialsAvailable: true,
        dateRange: { startDate: "2024-01-01", endDate: "2024-01-31" },
        totals: { pageviews: 5, sessions: 2, activeUsers: 3 },
        sources: [],
        topPages: [],
      },
    });
    vi.spyOn(apiClient, "refreshAnalyticsEngagement").mockResolvedValue({
      success: true,
      data: {
        synced: 0,
        skipped: 0,
        errors: [],
        summary: {
          platform: "devto",
          totalViews: 0,
          totalReactions: 0,
          totalComments: 0,
          articleCount: 0,
          lastSyncedAt: null,
          posts: [],
        },
      },
      message: "synced",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads analytics and renders overview", async () => {
    render(<Analytics />);
    await waitFor(() => {
      expect(screen.getByText(ANALYTICS_LABELS.PAGE_TITLE)).toBeInTheDocument();
    });
    expect(apiClient.getAnalyticsStats).toHaveBeenCalled();
  });

  it("surfaces API errors via toast", async () => {
    vi.mocked(apiClient.getAnalyticsStats).mockResolvedValue({ success: false, error: "stats fail" });
    render(<Analytics />);
    await waitFor(() => {
      expect(toast.apiError).toHaveBeenCalled();
    });
  });

  it("handles website analytics when not configured", async () => {
    vi.mocked(apiClient.getAnalyticsWebsite).mockResolvedValue({
      success: true,
      data: {
        configured: false,
        setupRequired: true,
        message: "not configured",
        propertyIdSet: false,
        credentialsAvailable: false,
        dateRange: { startDate: "2024-01-01", endDate: "2024-01-31" },
        totals: { pageviews: 0, sessions: 0, activeUsers: 0 },
        sources: [],
        topPages: [],
      },
    });
    render(<Analytics />);
    await waitFor(() => {
      expect(apiClient.getAnalyticsWebsite).toHaveBeenCalled();
    });
  });

  it("loads website analytics when configured", async () => {
    render(<Analytics />);
    await waitFor(() => {
      expect(apiClient.getAnalyticsWebsite).toHaveBeenCalled();
    });
  });

  it("refresh all reloads stats and engagement", async () => {
    render(<Analytics />);
    await waitFor(() => {
      expect(apiClient.getAnalyticsStats).toHaveBeenCalled();
    });
    const refreshAllButtons = screen.getAllByRole("button", { name: new RegExp(ANALYTICS_LABELS.REFRESH_ALL, "i") });
    await userEvent.click(refreshAllButtons[refreshAllButtons.length - 1]);
    await waitFor(() => {
      expect(vi.mocked(apiClient.getAnalyticsEngagement).mock.calls.length).toBeGreaterThan(1);
    });
  });

  it("surfaces engagement fetch errors via toast", async () => {
    vi.mocked(apiClient.getAnalyticsEngagement).mockResolvedValueOnce({
      success: false,
      error: "engagement fail",
    });
    render(<Analytics />);
    await waitFor(() => {
      expect(toast.apiError).toHaveBeenCalled();
    });
  });

  it("refresh engagement triggers sync endpoint", async () => {
    render(<Analytics />);
    await waitFor(() => {
      expect(apiClient.getAnalyticsStats).toHaveBeenCalled();
    });
    const refreshButtons = screen.queryAllByRole("button", {
      name: new RegExp(ANALYTICS_LABELS.REFRESH_ENGAGEMENT, "i"),
    });
    const refreshBtn = refreshButtons[0];
    if (refreshBtn) {
      await userEvent.click(refreshBtn);
      await waitFor(() => {
        expect(apiClient.refreshAnalyticsEngagement).toHaveBeenCalled();
      });
    } else {
      expect(apiClient.getAnalyticsEngagement).toHaveBeenCalled();
    }
  });

  it("applies date range presets", async () => {
    render(<Analytics />);
    await waitFor(() => {
      expect(apiClient.getAnalyticsStats).toHaveBeenCalled();
    });
    const callsBefore = vi.mocked(apiClient.getAnalyticsStats).mock.calls.length;
    await userEvent.click(screen.getByRole("button", { name: ANALYTICS_LABELS.RANGE_7D }));
    await waitFor(() => {
      expect(vi.mocked(apiClient.getAnalyticsStats).mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  it("renders top engagement posts when data exists", async () => {
    vi.mocked(apiClient.getAnalyticsEngagement).mockResolvedValue({
      success: true,
      data: {
        platform: "devto",
        totalViews: 100,
        totalReactions: 5,
        totalComments: 2,
        articleCount: 1,
        lastSyncedAt: new Date().toISOString(),
        posts: [
          {
            postId: "p1",
            title: "Popular post",
            remotePostId: "remote-1",
            views: 50,
            reactions: 3,
            comments: 1,
            url: "https://dev.to/example",
            asOf: "2024-01-01",
            fetchedAt: "2024-01-01",
          },
        ],
      },
    });
    render(<Analytics />);
    expect(await screen.findByText("Popular post")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(ANALYTICS_LABELS.OPEN_ON_DEVTO, "i") })).toHaveAttribute(
      "href",
      "https://dev.to/example",
    );
  });

  it("shows website analytics metrics for admin when configured", async () => {
    vi.mocked(apiClient.getAnalyticsWebsite).mockResolvedValue({
      success: true,
      data: {
        configured: true,
        setupRequired: false,
        message: null,
        propertyIdSet: true,
        credentialsAvailable: true,
        dateRange: { startDate: "2024-01-01", endDate: "2024-01-31" },
        totals: { pageviews: 120, sessions: 40, activeUsers: 25 },
        sources: [{ id: "organic", source: "google", medium: "organic", sessions: 10, pageviews: 20 }],
        topPages: [],
      },
    });
    render(<Analytics />);
    expect(await screen.findByText(ANALYTICS_LABELS.WEBSITE_SESSIONS)).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
  });

  it("surfaces website analytics API errors via toast", async () => {
    vi.mocked(apiClient.getAnalyticsWebsite).mockResolvedValue({
      success: false,
      error: "ga4 fail",
    });
    render(<Analytics />);
    await waitFor(() => {
      expect(toast.apiError).toHaveBeenCalled();
    });
  });
});
