import { describe, expect, it } from "vitest";

import { LABELS } from "@constants/messages";
import { POST_STATUS } from "@constants/postStatus";

import { isPostScheduleOverdue, isPostScheduled, resolvePostStatusDisplay } from "./postStatusDisplay";

describe("postStatusDisplay", () => {
  it("detects future scheduled drafts", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(isPostScheduled({ status: POST_STATUS.DRAFT, scheduled_for: future })).toBe(true);
    expect(isPostScheduleOverdue({ status: POST_STATUS.DRAFT, scheduled_for: future })).toBe(false);
  });

  it("detects overdue scheduled drafts", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(isPostScheduled({ status: POST_STATUS.DRAFT, scheduled_for: past })).toBe(false);
    expect(isPostScheduleOverdue({ status: POST_STATUS.DRAFT, scheduled_for: past })).toBe(true);
  });

  it("resolvePostStatusDisplay labels scheduled drafts", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const display = resolvePostStatusDisplay(POST_STATUS.DRAFT, future);
    expect(display.label).toBe(LABELS.POST_STATUS_SCHEDULED);
  });
});
