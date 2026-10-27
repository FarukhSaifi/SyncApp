import { POST_STATUS } from "@constants";
import { describe, expect, it } from "vitest";

import { normalizeScheduledFor, normalizeScheduledPlatforms, scheduledPublishDueFilter } from "./scheduleUtils";

describe("scheduleUtils", () => {
  it("normalizeScheduledFor returns null for empty and Date for future ISO", () => {
    expect(normalizeScheduledFor("")).toBeNull();
    expect(normalizeScheduledFor(null)).toBeNull();
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const d = normalizeScheduledFor(future);
    expect(d).toBeInstanceOf(Date);
  });

  it("normalizeScheduledFor rejects past when requireFuture", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(() => normalizeScheduledFor(past)).toThrow();
  });

  it("normalizeScheduledPlatforms filters blanks and unknown slugs", () => {
    expect(normalizeScheduledPlatforms(["devto", "", " linkedin ", "nope"])).toEqual(["devto", "linkedin"]);
  });

  it("scheduledPublishDueFilter targets past scheduled drafts", () => {
    const filter = scheduledPublishDueFilter(new Date("2026-01-01T00:00:00.000Z"));
    expect(filter.status).toBe(POST_STATUS.DRAFT);
    expect(filter.scheduled_for).toMatchObject({ $lte: expect.any(Date) });
  });

  it("normalizeScheduledFor rejects published status", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(() => normalizeScheduledFor(future, { currentStatus: POST_STATUS.PUBLISHED })).toThrow();
  });

  it("normalizeScheduledPlatforms requires platforms when scheduled", () => {
    const when = new Date(Date.now() + 86_400_000);
    expect(() => normalizeScheduledPlatforms([], { scheduledFor: when })).toThrow();
    expect(() => normalizeScheduledPlatforms(null, { scheduledFor: when })).toThrow();
    expect(normalizeScheduledPlatforms(["devto"], { scheduledFor: when })).toEqual(["devto"]);
  });

  it("normalizeScheduledPlatforms rejects non-array input", () => {
    expect(() => normalizeScheduledPlatforms("devto")).toThrow();
  });
});
