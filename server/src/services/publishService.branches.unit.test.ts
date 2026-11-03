import { config } from "@config";
import { DEFAULT_VALUES, ERROR_MESSAGES, PLATFORMS } from "@constants";
import type { ICredentialDocument } from "@models/Credential";
import type { IPostDocument } from "@models/Post";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const decryptCredential = vi.hoisted(() => vi.fn((value: string) => value.replace(/^enc:/, "")));

vi.mock("axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

vi.mock("@utils/encryption", () => ({
  decryptCredential,
}));

vi.mock("./linkedinOAuthService", () => ({
  resolveLinkedInAccess: vi.fn(async () => ({ accessToken: "li-token", personUrn: "urn:li:person:abc" })),
}));

import {
  platformSuccessMessage,
  publishToDevto,
  publishToLinkedin,
  publishToMedium,
  publishToWordpress,
} from "./publishService";

function mockPost(overrides: Partial<IPostDocument> = {}): IPostDocument {
  return {
    title: "Test post title for publish",
    content_markdown: "## Hello\n\nBody content for devto.",
    tags: ["javascript", "testing", "dup", "dup"],
    slug: "test-post-title",
    meta_description: "Meta description for SEO snippet on devto syndication.",
    platform_status: {},
    ...overrides,
  } as IPostDocument;
}

function mockCredential(platform: string, extra: Partial<ICredentialDocument> = {}): ICredentialDocument {
  return {
    platform_name: platform,
    encrypted_payload: "enc:payload",
    api_key: "enc:payload",
    ...extra,
  } as ICredentialDocument;
}

describe("publishService platform branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    decryptCredential.mockImplementation((value: string) => value.replace(/^enc:/, ""));
    config.canonicalBaseUrl = "https://blog.example.com";
  });

  it("platformSuccessMessage covers create, update, and skip", () => {
    expect(platformSuccessMessage(PLATFORMS.DEVTO, "create").length).toBeGreaterThan(0);
    expect(platformSuccessMessage(PLATFORMS.DEVTO, "update").length).toBeGreaterThan(0);
    expect(platformSuccessMessage(PLATFORMS.DEVTO, "skip").length).toBeGreaterThan(0);
    expect(platformSuccessMessage("unknown-platform", "create")).toContain("unknown-platform");
  });

  it("publishToMedium skips when already published", async () => {
    const post = mockPost({
      platform_status: {
        medium: { published: true, post_id: "m1", url: "https://medium.com/p/m1" },
      },
    } as Partial<IPostDocument>);
    const result = await publishToMedium(post, mockCredential(PLATFORMS.MEDIUM));
    expect(result.action).toBe("skip");
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("publishToMedium uses markdown contentFormat for plain text bodies", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { data: { id: "medium-user" } } });
    vi.mocked(axios.post).mockResolvedValue({
      data: { data: { id: "m-post-md", url: "https://medium.com/p/m-post-md" } },
    });
    await publishToMedium(mockPost({ content_markdown: "Plain markdown body" }), mockCredential(PLATFORMS.MEDIUM));
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ contentFormat: "markdown" }),
      expect.any(Object),
    );
  });

  it("publishToMedium uses html contentFormat for Quill HTML bodies", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { data: { id: "medium-user" } } });
    vi.mocked(axios.post).mockResolvedValue({
      data: { data: { id: "m-post-1", url: "https://medium.com/p/m-post-1" } },
    });
    const post = mockPost({ content_markdown: "<p>Hello <strong>world</strong></p>" });
    await publishToMedium(post, mockCredential(PLATFORMS.MEDIUM));
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ contentFormat: "html" }),
      expect.any(Object),
    );
  });

  it("publishToDevto builds canonical url from configured base and slug", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 8, url: "https://dev.to/u/8" } });
    config.canonicalBaseUrl = "https://blog.example.com";
    const post = mockPost({ slug: "my-post-slug", canonical_url: "not-a-url" });
    await publishToDevto(post, mockCredential(PLATFORMS.DEVTO));
    const body = vi.mocked(axios.post).mock.calls[0][1] as { article: Record<string, unknown> };
    expect(body.article.canonical_url).toBe("https://blog.example.com/my-post-slug");
  });

  it("publishToDevto sends canonical url, description, and http cover", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 7, url: "https://dev.to/u/7" } });
    const post = mockPost({
      canonical_url: "https://blog.example.com/my-post",
      cover_image: "https://cdn.example/cover.png",
    });
    await publishToDevto(post, mockCredential(PLATFORMS.DEVTO));
    const body = vi.mocked(axios.post).mock.calls[0][1] as { article: Record<string, unknown> };
    expect(body.article.canonical_url).toBe("https://blog.example.com/my-post");
    expect(body.article.description).toBeTruthy();
    expect(body.article.main_image).toBe("https://cdn.example/cover.png");
  });

  it("publishToDevto propagates axios failures from DEV.to API", async () => {
    vi.mocked(axios.post).mockRejectedValue(
      Object.assign(new Error("devto api failed"), {
        isAxiosError: true,
        response: { data: { error: "Tags are invalid" } },
      }),
    );
    await expect(publishToDevto(mockPost(), mockCredential(PLATFORMS.DEVTO))).rejects.toThrow("devto api failed");
  });

  it("publishToWordpress rejects missing site url", async () => {
    await expect(publishToWordpress(mockPost(), mockCredential(PLATFORMS.WORDPRESS))).rejects.toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_NOT_CONFIGURED,
    );
  });

  it("publishToWordpress updates remote post when already published", async () => {
    vi.mocked(axios.put).mockResolvedValue({ data: { id: 3, link: "https://wp.test/3" } });
    const post = mockPost({
      platform_status: { wordpress: { published: true, post_id: "3", url: "https://wp.test/3" } },
    } as Partial<IPostDocument>);
    const result = await publishToWordpress(post, mockCredential(PLATFORMS.WORDPRESS, { site_url: "https://wp.test" }));
    expect(result.action).toBe("update");
    expect(axios.put).toHaveBeenCalledOnce();
  });

  it("publishToLinkedin uses x-restli-id header when body id missing", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {},
      headers: { "x-restli-id": "urn:li:share:99" },
    });
    const post = mockPost({
      linkedin_post: "Teaser copy for LinkedIn with enough characters to publish.",
      linkedin_read_more_url: "https://blog.example.com/read",
    } as Partial<IPostDocument>);
    const result = await publishToLinkedin(post, mockCredential(PLATFORMS.LINKEDIN));
    expect(result.action).toBe("create");
    expect(result.updates["platform_status.linkedin.post_id"]).toBe("urn:li:share:99");
  });

  it("publishToLinkedin maps 401 responses to invalid token message", async () => {
    const { resolveLinkedInAccess } = await import("./linkedinOAuthService");
    vi.mocked(resolveLinkedInAccess).mockRejectedValueOnce(
      Object.assign(new Error("axios"), {
        isAxiosError: true,
        response: { status: 401, data: { message: "Unauthorized" } },
      }),
    );
    const post = mockPost({
      linkedin_post: "Teaser copy for LinkedIn with enough characters to publish.",
    } as Partial<IPostDocument>);
    await expect(publishToLinkedin(post, mockCredential(PLATFORMS.LINKEDIN))).rejects.toThrow(
      ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN,
    );
  });

  it("publishToLinkedin fails when API returns no post urn", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: {}, headers: {} });
    const post = mockPost({
      linkedin_post: "Teaser copy for LinkedIn with enough characters to publish.",
    } as Partial<IPostDocument>);
    await expect(publishToLinkedin(post, mockCredential(PLATFORMS.LINKEDIN))).rejects.toThrow(
      ERROR_MESSAGES.PUBLISHING_FAILED,
    );
  });

  it("publishToDevto rejects empty api key after decrypt", async () => {
    decryptCredential.mockReturnValueOnce("");
    await expect(publishToDevto(mockPost(), mockCredential(PLATFORMS.DEVTO))).rejects.toThrow(
      ERROR_MESSAGES.INVALID_DEVTO_API_KEY,
    );
  });

  it("publishToDevto surfaces credential decrypt failures", async () => {
    decryptCredential.mockImplementationOnce(() => {
      throw new Error(DEFAULT_VALUES.DECRYPT_OPENSSL_BAD_DECRYPT_SNIPPET);
    });
    await expect(publishToDevto(mockPost(), mockCredential(PLATFORMS.DEVTO))).rejects.toThrow(
      ERROR_MESSAGES.CREDENTIAL_DECRYPT_FAILED,
    );
  });
});
