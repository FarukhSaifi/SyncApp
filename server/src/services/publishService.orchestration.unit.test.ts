import { PLATFORMS, POST_STATUS } from "@constants";
import Credential from "@models/Credential";
import type { IPostDocument } from "@models/Post";
import Post from "@models/Post";
import User from "@models/User";
import axios from "axios";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { performPublishToAll, publishScheduledPosts } from "./publishService";

vi.mock("axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

vi.mock("@utils/encryption", () => ({
  decryptCredential: vi.fn(() => "api-key"),
}));

vi.mock("./linkedinOAuthService", () => ({
  resolveLinkedInAccess: vi.fn(async () => ({ accessToken: "li", personUrn: "urn:li:person:1" })),
}));

vi.mock("./notificationService", () => ({
  notifyScheduledPublishResult: vi.fn(async () => ({ email: "<skippe></skippe>d", slack: "skipped" })),
}));

vi.mock("@models/Post", () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock("@models/Credential", () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock("@models/User", () => ({
  default: {
    findById: vi.fn(),
  },
}));

function mockPost(overrides: Partial<IPostDocument> = {}): IPostDocument {
  return {
    _id: "post-id",
    author: "author-id",
    title: "Scheduled post title",
    content_markdown: "Body",
    tags: ["js"],
    platform_status: {},
    status: POST_STATUS.DRAFT,
    ...overrides,
  } as IPostDocument;
}

describe("publishService orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("performPublishToAll updates post when a platform succeeds", async () => {
    vi.mocked(Post.findById).mockResolvedValue(mockPost());
    vi.mocked(Credential.find).mockResolvedValue([
      { platform_name: PLATFORMS.DEVTO, author: "author-id", is_active: true },
    ] as never);
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 1, url: "https://dev.to/x" } });
    vi.mocked(Post.findByIdAndUpdate).mockResolvedValue(mockPost({ status: POST_STATUS.PUBLISHED }) as never);

    const result = await performPublishToAll(mockPost());
    expect(result.success).toBe(true);
    expect(result.successes?.length).toBeGreaterThan(0);
    expect(Post.findByIdAndUpdate).toHaveBeenCalledOnce();
  });

  it("publishScheduledPosts returns empty batch when none due", async () => {
    vi.mocked(Post.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue([]),
    } as never);
    const result = await publishScheduledPosts();
    expect(result.processed).toBe(0);
    expect(result.results).toEqual([]);
  });

  it("performPublishToAll throws when post document missing", async () => {
    vi.mocked(Post.findById).mockResolvedValue(null);
    await expect(performPublishToAll(mockPost())).rejects.toThrow(/not found/i);
  });

  it("performPublishToAll maps devto API error payloads in batch errors", async () => {
    vi.mocked(Post.findById).mockResolvedValue(mockPost());
    vi.mocked(Credential.find).mockResolvedValue([
      { platform_name: PLATFORMS.DEVTO, author: "author-id", is_active: true },
    ] as never);
    vi.mocked(axios.post).mockRejectedValue(
      Object.assign(new Error("devto"), {
        isAxiosError: true,
        response: { data: { error: "Tags are invalid" } },
      }),
    );

    const result = await performPublishToAll(mockPost());
    expect(result.success).toBe(false);
    expect(result.errors?.[0]?.error).toBe("Tags are invalid");
  });

  it("performPublishToAll returns failure when every platform errors", async () => {
    vi.mocked(Post.findById).mockResolvedValue(mockPost());
    vi.mocked(Credential.find).mockResolvedValue([
      { platform_name: PLATFORMS.DEVTO, author: "author-id", is_active: true },
    ] as never);
    vi.mocked(axios.post).mockRejectedValue(new Error("devto down"));

    const result = await performPublishToAll(mockPost());
    expect(result.success).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it("performPublishToAll reports partial success message when some platforms fail", async () => {
    vi.mocked(Post.findById).mockResolvedValue(mockPost());
    vi.mocked(Credential.find).mockResolvedValue([
      { platform_name: PLATFORMS.DEVTO, author: "author-id", is_active: true },
      { platform_name: PLATFORMS.MEDIUM, author: "author-id", is_active: true },
    ] as never);
    vi.mocked(axios.post)
      .mockResolvedValueOnce({ data: { id: 1, url: "https://dev.to/x" } })
      .mockRejectedValueOnce(new Error("medium fail"));
    vi.mocked(axios.get).mockResolvedValue({ data: { data: { id: "medium-user" } } });
    vi.mocked(Post.findByIdAndUpdate).mockResolvedValue(mockPost({ status: POST_STATUS.PUBLISHED }) as never);

    const result = await performPublishToAll(mockPost());
    expect(result.success).toBe(true);
    expect(result.errors?.length).toBe(1);
    expect(result.successes?.length).toBe(1);
  });

  it("publishScheduledPosts publishes due draft and notifies on success", async () => {
    const due = mockPost({
      scheduled_for: new Date(Date.now() - 1000),
      scheduled_platforms: [PLATFORMS.DEVTO],
    });
    vi.mocked(Post.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue([due]),
    } as never);
    vi.mocked(Post.findById).mockResolvedValue(due);
    vi.mocked(Credential.find).mockResolvedValue([
      { platform_name: PLATFORMS.DEVTO, author: "author-id", is_active: true },
    ] as never);
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 1, url: "https://dev.to/x" } });
    vi.mocked(Post.findByIdAndUpdate).mockResolvedValue(due as never);
    vi.mocked(User.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ email: "a@b.com", firstName: "A", lastName: "B" }),
      }),
    } as never);

    const result = await publishScheduledPosts();
    expect(result.processed).toBe(1);
    expect(result.results[0]?.outcome).toBe("success");
  });

  it("publishScheduledPosts marks partial when one platform fails", async () => {
    const due = mockPost({
      scheduled_for: new Date(Date.now() - 1000),
      scheduled_platforms: [PLATFORMS.DEVTO, PLATFORMS.MEDIUM],
    });
    vi.mocked(Post.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue([due]),
    } as never);
    vi.mocked(Post.findById).mockResolvedValue(due);
    vi.mocked(Credential.find).mockResolvedValue([
      { platform_name: PLATFORMS.DEVTO, author: "author-id", is_active: true },
      { platform_name: PLATFORMS.MEDIUM, author: "author-id", is_active: true },
    ] as never);
    vi.mocked(axios.post)
      .mockResolvedValueOnce({ data: { id: 1, url: "https://dev.to/x" } })
      .mockRejectedValueOnce(new Error("medium fail"));
    vi.mocked(axios.get).mockResolvedValue({ data: { data: { id: "medium-user" } } });
    vi.mocked(Post.findByIdAndUpdate).mockResolvedValue(due as never);
    vi.mocked(User.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ email: "a@b.com", firstName: "A", lastName: "B" }),
      }),
    } as never);

    const result = await publishScheduledPosts();
    expect(result.results[0]?.outcome).toBe("partial");
  });

  it("publishScheduledPosts sets truncated when batch exceeds max", async () => {
    const posts = Array.from({ length: 12 }, (_, i) =>
      mockPost({ _id: new mongoose.Types.ObjectId(`post-${i}`), scheduled_for: new Date(Date.now() - 1000) }),
    );
    vi.mocked(Post.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue(posts),
    } as never);
    vi.mocked(Post.findById).mockResolvedValue(null);

    const result = await publishScheduledPosts();
    expect(result.truncated).toBe(true);
    expect(result.processed).toBeGreaterThan(0);
  });

  it("performPublishToAll records unsupported platform errors", async () => {
    vi.mocked(Post.findById).mockResolvedValue(mockPost());
    vi.mocked(Credential.find).mockResolvedValue([
      { platform_name: "unknown-platform", author: "author-id", is_active: true },
    ] as never);

    const result = await performPublishToAll(mockPost());
    expect(result.success).toBe(false);
    expect(result.errors?.[0]?.platform).toBe("unknown-platform");
  });

  it("performPublishToAll returns published-to-all message on clean success", async () => {
    vi.mocked(Post.findById).mockResolvedValue(mockPost());
    vi.mocked(Credential.find).mockResolvedValue([
      { platform_name: PLATFORMS.DEVTO, author: "author-id", is_active: true },
    ] as never);
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 1, url: "https://dev.to/x" } });
    vi.mocked(Post.findByIdAndUpdate).mockResolvedValue(mockPost({ status: POST_STATUS.PUBLISHED }) as never);

    const result = await performPublishToAll(mockPost());
    expect(result.success).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it("publishScheduledPosts skips when author has no credentials", async () => {
    const due = mockPost({ scheduled_for: new Date(Date.now() - 1000), scheduled_platforms: [PLATFORMS.DEVTO] });
    vi.mocked(Post.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue([due]),
    } as never);
    vi.mocked(Post.findById).mockResolvedValue(due);
    vi.mocked(Credential.find).mockResolvedValue([]);
    vi.mocked(User.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ email: "a@b.com", firstName: "A", lastName: "B" }),
      }),
    } as never);

    const result = await publishScheduledPosts();
    expect(result.processed).toBe(1);
    expect(result.results[0]?.outcome).toBe("skipped_no_credentials");
  });
});
