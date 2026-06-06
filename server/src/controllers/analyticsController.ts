import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as analyticsService from "../services/analyticsService";

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
