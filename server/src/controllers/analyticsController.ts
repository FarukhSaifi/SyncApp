
import { HTTP_STATUS, SUCCESS_MESSAGES } from "@constants";
import { asyncHandler } from "@middleware/errorHandler";
import * as analyticsService from "@services/analyticsService";
import * as devtoEngagementService from "@services/devtoEngagementService";
import * as ga4AnalyticsService from "@services/ga4AnalyticsService";
import type { Request, Response } from "express";

/**
 * Get aggregated analytics for the authenticated user's posts
 * GET /api/analytics/stats
 */
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await analyticsService.getAnalyticsSummary(req.userId!);

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * Latest DEV.to engagement snapshots (from DB).
 * GET /api/analytics/engagement
 */
export const getEngagement = asyncHandler(async (req: Request, res: Response) => {
  const summary = await devtoEngagementService.getDevtoEngagementSummary(req.userId!);

  res.status(HTTP_STATUS["OK"]).json({
    success: true,
    data: summary,
  });
});

/**
 * Poll DEV.to with the user's API key and upsert snapshots.
 * POST /api/analytics/engagement/refresh
 */
export const refreshEngagement = asyncHandler(async (req: Request, res: Response) => {
  const result = await devtoEngagementService.syncDevtoEngagement(req.userId!);

  res.status(HTTP_STATUS["OK"]).json({
    success: true,
    data: result,
    message: SUCCESS_MESSAGES["ANALYTICS_DEVTO_SYNCED"](result.synced),
  });
});

/**
 * Public-blog GA4 website metrics (sessions, pageviews, traffic sources).
 * GET /api/analytics/website?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getWebsiteAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
  const data = await ga4AnalyticsService.getWebsiteAnalytics({ startDate, endDate });

  res.status(HTTP_STATUS["OK"]).json({
    success: true,
    data,
  });
});
