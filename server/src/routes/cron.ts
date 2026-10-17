import { handleScheduledPublish, handleSyncDevtoEngagement } from "@controllers/cronController";
import { Router } from "express";


const router = Router();

/**
 * GET /api/cron/publish-scheduled
 * Trigger the background task to publish posts that reached their scheduled time.
 */
router.get("/publish-scheduled", handleScheduledPublish);

/**
 * GET /api/cron/sync-devto-engagement
 * Refresh DEV.to engagement snapshots for users with active DEV.to credentials.
 */
router.get("/sync-devto-engagement", handleSyncDevtoEngagement);

export default router;
