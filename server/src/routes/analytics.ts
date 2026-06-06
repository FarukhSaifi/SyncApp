import { Router } from "express";
import { getStats } from "../controllers/analyticsController";
import { authenticateToken } from "../utils/auth";

const router = Router();

/**
 * GET /api/analytics/stats
 * Returns aggregated statistics for the authenticated user's posts and platforms.
 */
router.get("/stats", authenticateToken, getStats);

export default router;
