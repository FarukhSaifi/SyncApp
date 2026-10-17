
import { config } from "@config";
import { ERROR_MESSAGES, HTTP } from "@constants";
import { asyncHandler, UnauthorizedError } from "@middleware/errorHandler";
import { syncDevtoEngagementForAllUsers } from "@services/devtoEngagementService";
import { publishScheduledPosts } from "@services/publishService";
import { logger } from "@utils/logger";
import type { Request, Response } from "express";

import { CRON_SCHEDULE } from "@constants/notifications";

/**
 * Fail-closed cron auth: empty CRON_SECRET never skips checks.
 * Production requires a non-empty secret (also enforced at config load).
 */
function assertCronAuth(req: Request): void {
  const cronSecret = (process.env.CRON_SECRET || config.cronSecret || "").trim();
  const authHeader = typeof req.headers.authorization === "string" ? req.headers.authorization : "";

  if (!cronSecret) {
    throw new UnauthorizedError(ERROR_MESSAGES["CRON_AUTH_INVALID"]);
  }

  if (authHeader !== `${HTTP["AUTH_SCHEMES"]["BEARER"]} ${cronSecret}`) {
    throw new UnauthorizedError(ERROR_MESSAGES["CRON_AUTH_INVALID"]);
  }
}

/**
 * @operationId publishScheduledPosts
 * Vercel Cron endpoint — publishes due scheduled drafts (daily at 12:00 AM UTC).
 * Auth: Bearer CRON_SECRET
 */
export const handleScheduledPublish = asyncHandler(async (req: Request, res: Response) => {
  assertCronAuth(req);

  const result = await publishScheduledPosts();

  const outcomeSummary = result.results.map((r) => ({
    postId: r.postId,
    outcome: r.outcome,
    platformErrors: r.errors?.map((e) => `${e.platform}: ${e.error}`) ?? [],
  }));

  logger.info("Scheduled publish cron completed", {
    processed: result.processed,
    truncated: result.truncated,
    outcomes: outcomeSummary,
  });

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

/**
 * @operationId syncDevtoEngagement
 * Vercel Cron — refresh DEV.to view/reaction snapshots for all connected users.
 * Auth: Bearer CRON_SECRET
 */
export const handleSyncDevtoEngagement = asyncHandler(async (req: Request, res: Response) => {
  assertCronAuth(req);

  const result = await syncDevtoEngagementForAllUsers();

  logger.info("DEV.to engagement cron completed", {
    usersProcessed: result.usersProcessed,
    articlesSynced: result.articlesSynced,
    errorCount: result.userErrors.length,
  });

  res.json({
    success: true,
    operationId: "syncDevtoEngagement",
    message: `Synced DEV.to engagement for ${result.usersProcessed} users (${result.articlesSynced} articles)`,
    data: result,
  });
});
