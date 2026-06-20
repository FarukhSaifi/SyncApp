import type { Request, Response } from "express";
import { config } from "../config";
import { asyncHandler, UnauthorizedError } from "../middleware/errorHandler";
import * as postsService from "../services/postsService";

/**
 * Endpoint for Vercel Cron to trigger publishing of scheduled posts.
 * Protects against unauthorized access using CRON_SECRET.
 */
export const handleScheduledPublish = asyncHandler(async (req: Request, res: Response) => {
  // 1. Validate Cron Secret
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET || config.cronSecret;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    throw new UnauthorizedError("Invalid or missing CRON_SECRET");
  }

  // 2. Trigger Publishing
  const result = await postsService.publishScheduledPosts();

  // 3. Respond with summary
  res.json({
    success: true,
    message: `Processed ${result.count} scheduled posts`,
    data: result.results,
  });
});
