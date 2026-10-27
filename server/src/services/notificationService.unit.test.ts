import { config } from "@config";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({
  default: { post: vi.fn(async () => ({ status: 200 })) },
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: { send: vi.fn(async () => ({ data: { id: "email-1" } })) },
  })),
}));

import { notifyScheduledPublishResult } from "./notificationService";

describe("notifyScheduledPublishResult", () => {
  beforeEach(() => {
    config.slackWebhookUrl = "";
    config.resendApiKey = "";
    config.notificationFromEmail = "";
    config.notificationCcEmail = "";
  });

  it("sends slack when webhook is configured", async () => {
    const axios = (await import("axios")).default;
    config.slackWebhookUrl = "https://hooks.slack.test/services/abc";
    const post = vi.mocked(axios.post);
    post.mockResolvedValue({ status: 200 });

    const result = await notifyScheduledPublishResult({
      postId: "p1",
      title: "Scheduled title",
      outcome: "success",
      successes: ["devto"],
    });
    expect(result.slack).toBe("sent");
    expect(post).toHaveBeenCalledOnce();
  });

  it("sends email when Resend is configured", async () => {
    config.resendApiKey = "re_test";
    config.notificationFromEmail = "SyncApp <notify@test.com>";
    config.siteUrl = "https://app.test";

    const result = await notifyScheduledPublishResult({
      postId: "p1",
      title: "Scheduled title",
      outcome: "partial",
      authorEmail: "author@test.com",
      successes: ["medium"],
      errors: [{ platform: "devto", error: "timeout" }],
    });
    expect(result.email).toBe("sent");
  });

  it("returns skipped channels when email and slack are not configured", async () => {
    const result = await notifyScheduledPublishResult({
      postId: "p1",
      title: "Scheduled title",
      outcome: "success",
      successes: ["devto"],
    });
    expect(result.email).toBe("skipped");
    expect(result.slack).toBe("skipped");
  });

  it("marks slack failed when webhook post throws", async () => {
    const axios = (await import("axios")).default;
    config.slackWebhookUrl = "https://hooks.slack.test/services/abc";
    vi.mocked(axios.post).mockRejectedValueOnce(new Error("network"));

    const result = await notifyScheduledPublishResult({
      postId: "p1",
      title: "Scheduled title",
      outcome: "failed",
      errors: [{ platform: "devto", error: "boom" }],
      authorName: "Author",
      scheduledFor: new Date("2026-01-01T12:00:00Z"),
    });
    expect(result.slack).toBe("failed");
  });

  it("includes CC when notificationCcEmail is configured", async () => {
    config.resendApiKey = "re_test";
    config.notificationFromEmail = "SyncApp <notify@test.com>";
    config.notificationCcEmail = "cc@test.com";
    config.siteUrl = "https://app.test";

    const result = await notifyScheduledPublishResult({
      postId: "p1",
      title: "Scheduled title",
      outcome: "success",
      authorEmail: "author@test.com",
      successes: ["devto"],
    });
    expect(result.email).toBe("sent");
  });

  it("builds rich email for failed outcome with schedule and errors", async () => {
    config.resendApiKey = "re_test";
    config.notificationFromEmail = "SyncApp <notify@test.com>";
    config.siteUrl = "https://app.test";

    const result = await notifyScheduledPublishResult({
      postId: "p1",
      title: "Scheduled title",
      outcome: "failed",
      authorEmail: "author@test.com",
      authorName: "Author Name",
      scheduledFor: new Date("2026-01-01T12:00:00Z"),
      errors: [{ platform: "devto", error: "timeout" }],
    });
    expect(result.email).toBe("sent");
  });

  it("marks email failed when Resend returns error", async () => {
    const { Resend } = await import("resend");
    vi.mocked(Resend).mockImplementationOnce(
      () =>
        ({
          emails: {
            send: vi.fn(async () => ({ data: null, error: { message: "bad", name: "validation" } })),
          },
        }) as never,
    );
    config.resendApiKey = "re_test";
    config.notificationFromEmail = "SyncApp <notify@test.com>";
    config.siteUrl = "https://app.test";

    const result = await notifyScheduledPublishResult({
      postId: "p1",
      title: "Scheduled title",
      outcome: "skipped_no_credentials",
      authorEmail: "author@test.com",
    });
    expect(result.email).toBe("failed");
  });
});
