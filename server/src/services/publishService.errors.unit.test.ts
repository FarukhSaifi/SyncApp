import { ERROR_MESSAGES, PLATFORMS, POST_STATUS } from "@constants";
import type { ICredentialDocument } from "@models/Credential";
import Credential from "@models/Credential";
import type { IPostDocument } from "@models/Post";
import Post from "@models/Post";
import User from "@models/User";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

const decryptCredential = vi.hoisted(() => vi.fn(() => "api-key"));

vi.mock("@utils/encryption", () => ({
  decryptCredential,
}));

vi.mock("./linkedinOAuthService", () => ({
  resolveLinkedInAccess: vi.fn(async () => ({ accessToken: "li", personUrn: "urn:li:person:1" })),
}));

vi.mock("./notificationService", () => ({
  notifyScheduledPublishResult: vi.fn(async () => ({ email: "skipped", slack: "skipped" })),
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

import { resolveLinkedInAccess } from "./linkedinOAuthService";
import {
  performPublishToAll,
  publishScheduledPosts,
  publishToDevto,
  publishToMedium,
  publishToWordpress,
} from "./publishService";

function mockPost(overrides: Partial<IPostDocument> = {}): IPostDocument {
  return {
    _id: "post-id",
    author: "author-id",
    title: "Error path publish title",
    content_markdown: "## Body\n\nEnough content for publish error tests.",
    tags: ["javascript"],
    platform_status: {},
    status: POST_STATUS.DRAFT,
    ...overrides,
  } as IPostDocument;
}

function mockCredential(platform: string): ICredentialDocument {
  return {
    platform_name: platform,
    encrypted_payload: "enc:key",
    api_key: "enc:key",
    site_url: platform === PLATFORMS.WORDPRESS ? "https://wp.example" : undefined,
  } as ICredentialDocument;
}

describe("publishService error mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    decryptCredential.mockImplementation(() => "api-key");
  });

  it("performPublishToAll maps Medium API validation errors", async () => {
    vi.mocked(Post.findById).mockResolvedValue(mockPost());
    vi.mocked(Credential.find).mockResolvedValue([mockCredential(PLATFORMS.MEDIUM)] as never);
    vi.mocked(axios.get).mockResolvedValue({ data: { data: { id: "medium-user" } } });
    vi.mocked(axios.post).mockRejectedValue(
      Object.assign(new Error("medium"), {
        isAxiosError: true,
        response: { data: { errors: [{ message: "Title too short" }, { message: "Invalid tag" }] } },
      }),
    );

    const result = await performPublishToAll(mockPost());
    expect(result.success).toBe(false);
    expect(result.errors?.[0]?.error).toContain("Title too short");
  });

  it("performPublishToAll maps Dev.to message and errors array shapes", async () => {
    vi.mocked(Post.findById).mockResolvedValue(mockPost());
    vi.mocked(Credential.find).mockResolvedValue([mockCredential(PLATFORMS.DEVTO)] as never);
    vi.mocked(axios.post).mockRejectedValueOnce(
      Object.assign(new Error("devto"), {
        isAxiosError: true,
        response: { data: { message: "Rate limited" } },
      }),
    );

    const messageResult = await performPublishToAll(mockPost());
    expect(messageResult.errors?.[0]?.error).toBe("Rate limited");

    vi.mocked(axios.post).mockRejectedValueOnce(
      Object.assign(new Error("devto"), {
        isAxiosError: true,
        response: { data: { errors: [{ message: "Body invalid" }] } },
      }),
    );
    const arrayResult = await performPublishToAll(mockPost());
    expect(arrayResult.errors?.[0]?.error).toBe("Body invalid");
  });

  it("performPublishToAll maps LinkedIn 403 to invalid token message", async () => {
    vi.mocked(Post.findById).mockResolvedValue(
      mockPost({
        linkedin_post: "LinkedIn summary with enough characters for publish error mapping test.",
      }),
    );
    vi.mocked(Credential.find).mockResolvedValue([mockCredential(PLATFORMS.LINKEDIN)] as never);
    vi.mocked(resolveLinkedInAccess).mockRejectedValueOnce(
      Object.assign(new Error("axios"), {
        isAxiosError: true,
        response: { status: 403, data: { message: "Forbidden" } },
      }),
    );

    const result = await performPublishToAll(mockPost());
    expect(result.errors?.[0]?.error).toBe(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN);
  });

  it("performPublishToAll maps WordPress generic failures", async () => {
    vi.mocked(Post.findById).mockResolvedValue(mockPost());
    vi.mocked(Credential.find).mockResolvedValue([mockCredential(PLATFORMS.WORDPRESS)] as never);
    vi.mocked(axios.post).mockRejectedValue(new Error("wordpress down"));

    const result = await performPublishToAll(mockPost());
    expect(result.success).toBe(false);
    expect(result.errors?.[0]?.error).toBe("wordpress down");
  });

  it("publishScheduledPosts records failed outcome when all platforms fail", async () => {
    const due = mockPost({
      scheduled_for: new Date(Date.now() - 1000),
      scheduled_platforms: [PLATFORMS.DEVTO],
    });
    vi.mocked(Post.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue([due]),
    } as never);
    vi.mocked(Post.findById).mockResolvedValue(due);
    vi.mocked(Credential.find).mockResolvedValue([mockCredential(PLATFORMS.DEVTO)] as never);
    vi.mocked(axios.post).mockRejectedValue(new Error("devto unavailable"));
    vi.mocked(User.findById).mockReturnValue({
      select: () => ({
        lean: async () => null,
      }),
    } as never);

    const result = await publishScheduledPosts();
    expect(result.results[0]?.outcome).toBe("failed");
    expect(result.results[0]?.reason).toBe("ALL_PLATFORMS_FAILED");
  });

  it("publishScheduledPosts handles unexpected throw when post disappears", async () => {
    const due = mockPost({ scheduled_for: new Date(Date.now() - 1000) });
    vi.mocked(Post.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue([due]),
    } as never);
    vi.mocked(Post.findById).mockResolvedValue(null);
    vi.mocked(User.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ email: "a@b.com", firstName: "A", lastName: "B" }),
      }),
    } as never);

    const result = await publishScheduledPosts();
    expect(result.results[0]?.outcome).toBe("failed");
    expect(result.results[0]?.errors?.[0]?.platform).toBeTruthy();
  });

  it("performPublishToAll maps Dev.to string errors and JSON fallback payloads", async () => {
    vi.mocked(Post.findById).mockResolvedValue(mockPost());
    vi.mocked(Credential.find).mockResolvedValue([mockCredential(PLATFORMS.DEVTO)] as never);

    vi.mocked(axios.post).mockRejectedValueOnce(
      Object.assign(new Error("devto"), {
        isAxiosError: true,
        response: { data: { errors: ["Tag spam", { message: "Body too short" }] } },
      }),
    );
    const stringErrors = await performPublishToAll(mockPost());
    expect(stringErrors.errors?.[0]?.error).toContain("Tag spam");

    vi.mocked(axios.post).mockRejectedValueOnce(
      Object.assign(new Error("devto"), {
        isAxiosError: true,
        response: { data: { code: 422, detail: "validation" } },
      }),
    );
    const jsonFallback = await performPublishToAll(mockPost());
    expect(jsonFallback.errors?.[0]?.error).toContain("422");
  });

  it("performPublishToAll reports unsupported platforms and missing credentials", async () => {
    vi.mocked(Post.findById).mockResolvedValue(mockPost());
    vi.mocked(Credential.find).mockResolvedValue([
      { platform_name: "tumblr", encrypted_payload: "enc:key", api_key: "enc:key" },
    ] as never);
    const unsupported = await performPublishToAll(mockPost());
    expect(unsupported.errors?.[0]?.error).toBe(ERROR_MESSAGES.PLATFORM_NOT_SUPPORTED);

    vi.mocked(Credential.find).mockResolvedValue([] as never);
    await expect(performPublishToAll(mockPost())).rejects.toThrow(ERROR_MESSAGES.NO_ACTIVE_CREDENTIALS);
  });

  it("performPublishToAll maps LinkedIn error_description responses", async () => {
    vi.mocked(Post.findById).mockResolvedValue(
      mockPost({
        linkedin_post: "LinkedIn summary with enough characters for publish error mapping test.",
      }),
    );
    vi.mocked(Credential.find).mockResolvedValue([mockCredential(PLATFORMS.LINKEDIN)] as never);
    vi.mocked(resolveLinkedInAccess).mockResolvedValueOnce({
      accessToken: "li",
      personUrn: "urn:li:person:1",
    });
    vi.mocked(axios.post).mockRejectedValueOnce(
      Object.assign(new Error("linkedin"), {
        isAxiosError: true,
        response: { status: 400, data: { error_description: "Expired token" } },
      }),
    );
    const result = await performPublishToAll(mockPost());
    expect(result.errors?.[0]?.error).toBe("Expired token");
  });

  it("publishToMedium and publishToWordpress reject empty api keys", async () => {
    decryptCredential.mockReturnValue("");
    await expect(publishToMedium(mockPost(), mockCredential(PLATFORMS.MEDIUM))).rejects.toThrow(
      ERROR_MESSAGES.INVALID_MEDIUM_API_KEY,
    );
    await expect(publishToWordpress(mockPost(), mockCredential(PLATFORMS.WORDPRESS))).rejects.toThrow(
      ERROR_MESSAGES.INVALID_WORDPRESS_API_KEY,
    );
  });

  it("publishToDevto omits invalid cover images from article payload", async () => {
    decryptCredential.mockReturnValue("devto-key");
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 1, url: "https://dev.to/u/1" } });
    const post = mockPost({
      cover_image: "data:image/png;base64,abc",
    });
    await publishToDevto(post, mockCredential(PLATFORMS.DEVTO));
    const body = vi.mocked(axios.post).mock.calls[0][1] as { article: Record<string, unknown> };
    expect(body.article.main_image).toBe("");
  });

  it("publishToWordpress creates post when not yet published", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 9, link: "https://wp.example/9" } });
    const result = await publishToWordpress(mockPost(), mockCredential(PLATFORMS.WORDPRESS));
    expect(result.action).toBe("create");
    expect(axios.post).toHaveBeenCalledOnce();
  });
});
