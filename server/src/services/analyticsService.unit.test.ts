import { POST_STATUS } from "@constants";
import { beforeEach, describe, expect, it, vi } from "vitest";


const aggregate = vi.fn();

vi.mock("@models/Post", () => ({
  default: { aggregate: (...args: unknown[]) => aggregate(...args) },
}));

import { getAnalyticsSummary } from "./analyticsService";

describe("analyticsService.getAnalyticsSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("combines status, platform, and history aggregates", async () => {
    aggregate
      .mockResolvedValueOnce([{ _id: POST_STATUS.PUBLISHED, count: 2 }, { _id: POST_STATUS.DRAFT, count: 1 }])
      .mockResolvedValueOnce([
        {
          medium: [{ count: 1 }],
          devto: [{ count: 2 }],
          wordpress: [],
          linkedin: [],
        },
      ])
      .mockResolvedValueOnce([{ _id: "2026-01-01", count: 3, published: 1 }]);

    const result = await getAnalyticsSummary("507f1f77bcf86cd799439011");
    expect(result.summary.totalPosts).toBe(3);
    expect(result.summary.totalPublished).toBe(2);
    expect(result.platformStats.devto).toBe(2);
    expect(result.history).toHaveLength(1);
  });
});
