import { PLATFORMS } from "@constants";
import { beforeEach, describe, expect, it, vi } from "vitest";


const mockCredentialFindOne = vi.fn();
const mockPostFind = vi.fn();
const mockSnapshotFind = vi.fn();
const mockSnapshotUpsert = vi.fn();

vi.mock("@models/Credential", () => ({
  default: {
    findOne: (...args: unknown[]) => mockCredentialFindOne(...args),
    find: vi.fn(() => ({ select: vi.fn().mockReturnValue({ lean: vi.fn(async () => [{ author: "507f1f77bcf86cd799439011" }]) }) })),
  },
}));

vi.mock("@models/Post", () => ({
  default: {
    find: (...args: unknown[]) => mockPostFind(...args),
  },
}));

vi.mock("@models/PostAnalyticsSnapshot", () => ({
  default: {
    find: (...args: unknown[]) => mockSnapshotFind(...args),
    findOneAndUpdate: (...args: unknown[]) => mockSnapshotUpsert(...args),
  },
}));

vi.mock("@utils/encryption", () => ({
  decryptCredential: vi.fn(() => "devto-api-key"),
}));

import {
  getDevtoEngagementSummary,
  syncDevtoEngagement,
  syncDevtoEngagementForAllUsers,
} from "./devtoEngagementService";

describe("devtoEngagementService", () => {
  const userId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    vi.clearAllMocks();
    mockCredentialFindOne.mockReturnValue({
      lean: vi.fn(async () => ({
        encrypted_payload: "enc:key",
        platform_name: PLATFORMS["DEVTO"],
      })),
    });
    mockSnapshotFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn(async () => []),
      }),
    });
    mockSnapshotUpsert.mockResolvedValue({});
  });

  it("getDevtoEngagementSummary aggregates empty snapshots", async () => {
    const summary = await getDevtoEngagementSummary(userId);
    expect(summary.platform).toBe("devto");
    expect(summary.articleCount).toBe(0);
    expect(summary.totalViews).toBe(0);
  });

  it("syncDevtoEngagement returns early when no published devto posts", async () => {
    mockPostFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({ lean: vi.fn(async () => []) }),
      }),
    });

    const result = await syncDevtoEngagement(userId);
    expect(result.synced).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it("syncDevtoEngagement upserts snapshot when DEV.to API returns metrics", async () => {
    mockPostFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn(async () => [
            {
              _id: "post1",
              title: "Article",
              platform_status: { devto: { published: true, post_id: "42", url: "https://dev.to/x" } } as never,
            },
          ]),
        }),
      }),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 42,
            title: "Article",
            url: "https://dev.to/x",
            page_views_count: 10,
            public_reactions_count: 2,
            comments_count: 1,
          },
        ],
      })) as never,
    );

    const result = await syncDevtoEngagement(userId);
    expect(result.synced).toBe(1);
    expect(mockSnapshotUpsert).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("getDevtoEngagementSummary totals snapshot metrics", async () => {
    mockSnapshotFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn(async () => [
          {
            post: "post1",
            title: "Article",
            remote_post_id: "42",
            url: "https://dev.to/x",
            views: 10,
            reactions: 2,
            comments: 1,
            as_of: new Date(),
            fetched_at: new Date(),
          },
        ]),
      }),
    });

    const summary = await getDevtoEngagementSummary(userId);
    expect(summary.articleCount).toBe(1);
    expect(summary.totalViews).toBe(10);
    expect(summary.totalReactions).toBe(2);
  });

  it("syncDevtoEngagement rejects empty decrypted api key", async () => {
    const { decryptCredential } = await import("@utils/encryption");
    vi.mocked(decryptCredential).mockReturnValueOnce("   ");
    mockPostFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({ lean: vi.fn(async () => []) }),
      }),
    });
    await expect(syncDevtoEngagement(userId)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("syncDevtoEngagement rejects decrypt failures", async () => {
    const { decryptCredential } = await import("@utils/encryption");
    vi.mocked(decryptCredential).mockImplementationOnce(() => {
      throw new Error("bad decrypt");
    });
    await expect(syncDevtoEngagement(userId)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("syncDevtoEngagement skips articles without remote ids in /me feed", async () => {
    mockPostFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn(async () => [
            {
              _id: "post-no-id",
              title: "No id",
              platform_status: { devto: { published: true, post_id: "777", url: "" } } as never,
            },
          ]),
        }),
      }),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [{ title: "missing id row" }],
      })) as never,
    );
    const result = await syncDevtoEngagement(userId);
    expect(result.synced).toBe(0);
    vi.unstubAllGlobals();
  });

  it("syncDevtoEngagement treats article 404 as skipped remote", async () => {
    mockPostFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn(async () => [
            {
              _id: "post-missing-remote",
              title: "Missing remote",
              platform_status: { devto: { published: true, post_id: "404", url: "" } } as never,
            },
          ]),
        }),
      }),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("articles/me")) {
          return { ok: true, status: 200, json: async () => [] };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      }) as never,
    );
    const result = await syncDevtoEngagement(userId);
    expect(result.skipped).toBe(1);
    vi.unstubAllGlobals();
  });

  it("syncDevtoEngagement throws when credential missing", async () => {
    mockCredentialFindOne.mockReturnValue({ lean: vi.fn(async () => null) });
    await expect(syncDevtoEngagement(userId)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("syncDevtoEngagement fetches article by id when missing from /me list", async () => {
    mockPostFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn(async () => [
            {
              _id: "post2",
              title: "Fallback article",
              platform_status: { devto: { published: true, post_id: "99", url: "" } } as never,
            },
          ]),
        }),
      }),
    });

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("articles/me")) {
        return { ok: true, status: 200, json: async () => [] };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 99,
          title: "Fallback article",
          url: "https://dev.to/fallback",
          page_views_count: 3,
          public_reactions_count: 1,
          comments_count: 0,
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock as never);

    const result = await syncDevtoEngagement(userId);
    expect(result.synced).toBe(1);
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("99"))).toBe(true);
    vi.unstubAllGlobals();
  });

  it("syncDevtoEngagement records per-post errors without aborting batch", async () => {
    mockPostFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn(async () => [
            {
              _id: "post-bad",
              title: "Broken",
              platform_status: { devto: { published: true, post_id: "bad", url: "" } } as never,
            },
          ]),
        }),
      }),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("articles/me")) {
          return { ok: true, status: 200, json: async () => [] };
        }
        return { ok: false, status: 502, json: async () => ({}) };
      }) as never,
    );

    const result = await syncDevtoEngagement(userId);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].postId).toBe("post-bad");
    vi.unstubAllGlobals();
  });

  it("syncDevtoEngagement rejects invalid API key on unauthorized response", async () => {
    mockPostFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn(async () => [
            {
              _id: "post1",
              title: "Article",
              platform_status: { devto: { published: true, post_id: "1", url: "" } } as never,
            },
          ]),
        }),
      }),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({}),
      })) as never,
    );

    await expect(syncDevtoEngagement(userId)).rejects.toMatchObject({ statusCode: 400 });
    vi.unstubAllGlobals();
  });

  it("syncDevtoEngagementForAllUsers captures user-level sync failures", async () => {
    mockCredentialFindOne.mockReturnValue({ lean: vi.fn(async () => null) });

    const out = await syncDevtoEngagementForAllUsers();
    expect(out.usersProcessed).toBe(1);
    expect(out.userErrors).toHaveLength(1);
  });

  it("syncDevtoEngagementForAllUsers processes credential holders", async () => {
    mockPostFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({ lean: vi.fn(async () => []) }),
      }),
    });

    const out = await syncDevtoEngagementForAllUsers();
    expect(out.usersProcessed).toBe(1);
    expect(out.articlesSynced).toBe(0);
  });
});
