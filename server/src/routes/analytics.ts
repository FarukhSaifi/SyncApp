
import {
  getEngagement,
  getStats,
  getWebsiteAnalytics,
  refreshEngagement,
} from "@controllers/analyticsController";
import { authenticateToken, requireAdmin } from "@utils/auth";
import { Router } from "express";

const router = Router();

/**
 * GET /api/analytics/stats
 * Returns aggregated statistics for the authenticated user's posts and platforms.
 */
router.get("/stats", authenticateToken, getStats);

/**
 * GET /api/analytics/engagement
 * Latest DEV.to engagement snapshots (views / reactions / comments).
 */
router.get("/engagement", authenticateToken, getEngagement);

/**
 * POST /api/analytics/engagement/refresh
 * Sync DEV.to engagement using the user's stored API key.
 */
router.post("/engagement/refresh", authenticateToken, refreshEngagement);

/**
 * GET /api/analytics/website
 * GA4 blog sessions / pageviews / traffic sources (admin only; requires GOOGLE_ANALYTICS_PROPERTY_ID).
 */
router.get("/website", authenticateToken, requireAdmin, getWebsiteAnalytics);

export default router;
