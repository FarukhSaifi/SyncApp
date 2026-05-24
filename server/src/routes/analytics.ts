import { Router } from "express";
import { getStats } from "../controllers/analyticsController";

const router = Router();

/**
 * GET /api/analytics/stats
 * Returns aggregated statistics for posts and platforms.
 */
router.get("/stats", getStats);

export default router;
