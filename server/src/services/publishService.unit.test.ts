import { ERROR_MESSAGES, PLATFORMS } from "@constants";
import type { ICredentialDocument } from "@models/Credential";
import type { IPostDocument } from "@models/Post";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("@utils/encryption", () => ({
  decryptCredential: vi.fn(() => "plain-api-key"),
}));

vi.mock("./linkedinOAuthService", () => ({
  resolveLinkedInAccess: vi.fn(async () => ({ accessToken: "li-token", personUrn: "urn:li:person:1" })),
}));

vi.mock("./notificationService", () => ({
  notifyScheduledPublishResult: vi.fn(async () => undefined),
}));

import { publishToDevto, publishToLinkedin, publishToMedium, publishToWordpress } from "./publishService";

function mockPost(overrides: Partial<IPostDocument> = {}): IPostDocument {
  return {
    title: "Test post title for publish",
    content_markdown: "## Hello\n\nBody content for devto.",
    tags: ["javascript", "testing"],
    slug: "test-post-title",
    platform_status: {},
    ...overrides,
  } as IPostDocument;
}

function mockCredential(platform: string): ICredentialDocument {
  return {
    platform_name: platform,
    encrypted_payload: "enc:payload",
    api_key: "enc:payload",
  } as ICredentialDocument;
}

describe("publishService platform publishers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publishToMedium creates remote post", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { data: { id: "medium-user" } } });
    vi.mocked(axios.post).mockResolvedValue({
      data: { data: { id: "m-post-1", url: "https://medium.com/p/m-post-1" } },
    });

    const result = await publishToMedium(mockPost(), mockCredential(PLATFORMS.MEDIUM));
    expect(result.action).toBe("create");
    expect(result.updates[`platform_status.medium.published`]).toBe(true);
  });

  it("publishToDevto creates article when not yet published", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { id: 99, url: "https://dev.to/u/slug" },
    });

    const result = await publishToDevto(mockPost(), mockCredential(PLATFORMS.DEVTO));
    expect(result.action).toBe("create");
    expect(axios.post).toHaveBeenCalledOnce();
  });

  it("publishToDevto updates when already published", async () => {
    vi.mocked(axios.put).mockResolvedValue({
      data: { id: 99, url: "https://dev.to/u/slug" },
    });

    const post = mockPost({
      platform_status: {
        devto: { published: true, post_id: "99", url: "https://dev.to/u/slug" },
      },
    } as Partial<IPostDocument>);

    const result = await publishToDevto(post, mockCredential(PLATFORMS.DEVTO));
    expect(result.action).toBe("update");
    expect(axios.put).toHaveBeenCalledOnce();
  });

  it("publishToWordpress creates remote post when site_url is set", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { id: 12, link: "https://wp.test/post/12" },
    });

    const credential = {
      ...mockCredential(PLATFORMS.WORDPRESS),
      site_url: "https://wp.test",
    } as ICredentialDocument;

    const result = await publishToWordpress(mockPost(), credential);
    expect(result.action).toBe("create");
    expect(result.updates[`platform_status.wordpress.published`]).toBe(true);
  });

  it("publishToLinkedin posts UGC when summary is present", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { id: "urn:li:share:1" },
      headers: {},
    });

    const post = mockPost({
      linkedin_post: "Teaser copy for LinkedIn",
      canonical_url: "https://blog.test/my-slug",
    } as Partial<IPostDocument>);

    const result = await publishToLinkedin(post, mockCredential(PLATFORMS.LINKEDIN));
    expect(result.action).toBe("create");
    expect(axios.post).toHaveBeenCalledOnce();
  });

  it("publishToLinkedin rejects empty summary", async () => {
    await expect(publishToLinkedin(mockPost(), mockCredential(PLATFORMS.LINKEDIN))).rejects.toThrow(
      ERROR_MESSAGES.LINKEDIN_SUMMARY_REQUIRED,
    );
  });
});
