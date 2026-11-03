import { config } from "@config";
import { HTTP } from "@constants";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_MESSAGES } from "@constants/messages";


const cronMocks = vi.hoisted(() => ({
  publishScheduledPosts: vi.fn(async () => ({
    processed: 1,
    truncated: false,
    results: [{ postId: "p1", outcome: "success", successes: ["devto"], errors: [], notification: {} }],
  })),
  syncDevtoEngagementForAllUsers: vi.fn(async () => ({
    usersProcessed: 2,
    articlesSynced: 3,
    userErrors: [],
  })),
}));

vi.mock("@services/publishService", () => ({
  publishScheduledPosts: cronMocks.publishScheduledPosts,
}));

vi.mock("@services/devtoEngagementService", () => ({
  syncDevtoEngagementForAllUsers: cronMocks.syncDevtoEngagementForAllUsers,
}));

import { handleScheduledPublish, handleSyncDevtoEngagement } from "./cronController";

async function runHandler(
  handler: (req: unknown, res: unknown, next: (err?: unknown) => void) => void,
  req: unknown,
  res: { json: ReturnType<typeof vi.fn> },
): Promise<void> {
  handler(req, res, vi.fn());
  await vi.waitFor(() => expect(res.json).toHaveBeenCalled(), { timeout: 2000 });
}

describe("cronController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.cronSecret = "cron-test-secret";
    process.env.CRON_SECRET = "cron-test-secret";
  });

  it("handleScheduledPublish rejects missing bearer token", async () => {
    const next = vi.fn();
    handleScheduledPublish({ headers: {} } as never, { json: vi.fn() } as never, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 2000 });
    expect((next.mock.calls[0][0] as Error).message).toBe(ERROR_MESSAGES.CRON_AUTH_INVALID);
  });

  it("handleScheduledPublish runs when authorized", async () => {
    const json = vi.fn();
    await runHandler(
      handleScheduledPublish as never,
      { headers: { authorization: `${HTTP.AUTH_SCHEMES.BEARER} cron-test-secret` } },
      { json },
    );
    expect(cronMocks.publishScheduledPosts).toHaveBeenCalledOnce();
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true, operationId: "publishScheduledPosts" }));
  });

  it("handleSyncDevtoEngagement runs when authorized", async () => {
    const json = vi.fn();
    await runHandler(
      handleSyncDevtoEngagement as never,
      { headers: { authorization: `${HTTP.AUTH_SCHEMES.BEARER} cron-test-secret` } },
      { json },
    );
    expect(cronMocks.syncDevtoEngagementForAllUsers).toHaveBeenCalledOnce();
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true, operationId: "syncDevtoEngagement" }));
  });
});
