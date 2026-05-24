import { Router } from 'express';
import { handleScheduledPublish } from '../controllers/cronController';

const router = Router();

/**
 * GET /api/cron/publish-scheduled
 * Trigger the background task to publish posts that reached their scheduled time.
 */
router.get('/publish-scheduled', handleScheduledPublish);

export default router;
