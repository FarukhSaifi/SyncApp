import type { Request, Response } from "express";
import { config } from "../config";
import { CRON_SCHEDULE } from "../constants/notifications";
import { asyncHandler, UnauthorizedError } from "../middleware/errorHandler";
import { publishScheduledPosts } from "../services/publishService";

/**
 * @operationId publishScheduledPosts
 * Vercel Cron endpoint — publishes due scheduled drafts (daily midnight UTC).
 * Auth: Bearer CRON_SECRET
 */
export const handleScheduledPublish = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET || config.cronSecret;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    throw new UnauthorizedError("Invalid or missing CRON_SECRET");
  }

  const result = await publishScheduledPosts();

  res.json({
    success: true,
    operationId: "publishScheduledPosts",
    message: `Processed ${result.processed} scheduled posts`,
    data: {
      processed: result.processed,
      truncated: result.truncated,
      cronSchedule: CRON_SCHEDULE,
      results: result.results,
    },
  });
});
