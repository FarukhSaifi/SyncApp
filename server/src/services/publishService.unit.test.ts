import { ERROR_MESSAGES, PLATFORM_SYNC, PLATFORMS } from "@constants";
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
  encryptCredential: vi.fn(() => "enc:payload"),
}));

vi.mock("./linkedinOAuthService", () => ({
  resolveLinkedInAccess: vi.fn(async () => ({ accessToken: "li-token", personUrn: "urn:li:person:1" })),
}));

vi.mock("./notificationService", () => ({
  notifyScheduledPublishResult: vi.fn(async () => undefined),
}));

const credentialFindOne = vi.hoisted(() => vi.fn());
const postFindById = vi.hoisted(() => vi.fn());
const postFindOneAndUpdate = vi.hoisted(() => vi.fn());
const postUpdateOne = vi.hoisted(() => vi.fn());

vi.mock("@models/Credential", () => ({
  default: {
    findOne: (...args: unknown[]) => credentialFindOne(...args),
    find: vi.fn(),
  },
}));

vi.mock("@models/Post", () => ({
  default: {
    findById: (...args: unknown[]) => postFindById(...args),
    findOneAndUpdate: (...args: unknown[]) => postFindOneAndUpdate(...args),
    updateOne: (...args: unknown[]) => postUpdateOne(...args),
    findOne: vi.fn(),
  },
}));

import {
  publishToDevto,
  publishToLinkedin,
  publishToMedium,
  publishToWordpress,
  syncPublishedCoverToDevto,
  syncPublishedCoverToLinkedin,
  syncPublishedPostToDevto,
  syncPublishedPostToMedium,
  syncPublishedPostToWordpress,
} from "./publishService";

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

function mockCredential(platform: string, extra: Partial<ICredentialDocument> = {}): ICredentialDocument {
  const base: Record<string, unknown> = {
    platform_name: platform,
    encrypted_payload: "enc:payload",
    api_key: "enc:payload",
  };
  if (platform === PLATFORMS.WORDPRESS) {
    base.site_url = "https://wp.test";
    base.platform_config = { wordpress_username: "wpuser" };
  }
  return { ...base, ...extra } as ICredentialDocument;
}

describe("publishService platform publishers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    postFindById.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    });
    postFindOneAndUpdate.mockResolvedValue({ _id: "p1" });
    postUpdateOne.mockResolvedValue({ acknowledged: true });
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (typeof url === "string" && url.includes("/tags")) {
        return { data: [] };
      }
      return { data: Buffer.from("img"), headers: { "content-type": "image/jpeg" } };
    });
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

  it("syncPublishedPostToDevto no-ops when post is not live on DEV.to", async () => {
    const synced = await syncPublishedPostToDevto(mockPost({ _id: "p1" } as never), "user-1");
    expect(synced).toBe(false);
    expect(credentialFindOne).not.toHaveBeenCalled();
    expect(axios.put).not.toHaveBeenCalled();
  });

  it("syncPublishedPostToDevto PUTs article fields when already published", async () => {
    credentialFindOne.mockResolvedValue(mockCredential(PLATFORMS.DEVTO));
    vi.mocked(axios.put).mockResolvedValue({
      data: { id: 99, url: "https://dev.to/u/slug" },
    });

    const post = mockPost({
      _id: "p1",
      title: "Synced title for DEV.to",
      content_markdown: "## Updated body",
      tags: ["javascript", "node"],
      meta_description: "Short meta for sync",
      canonical_url: "https://example.com/synced-title",
      cover_image: "https://cdn.example/cover-new.webp",
      platform_status: {
        devto: { published: true, post_id: "99", url: "https://dev.to/u/slug" },
      },
    } as never);

    const synced = await syncPublishedPostToDevto(post, "user-1");
    expect(synced).toBe(true);
    expect(axios.put).toHaveBeenCalledOnce();
    const [, body] = vi.mocked(axios.put).mock.calls[0] as [
      string,
      {
        article: {
          title?: string;
          body_markdown?: string;
          tags?: string[];
          description?: string;
          canonical_url?: string;
          main_image?: string;
        };
      },
    ];
    expect(body.article.title).toBe("Synced title for DEV.to");
    expect(body.article.body_markdown).toBe("## Updated body");
    expect(body.article.tags).toEqual(["javascript", "node"]);
    expect(body.article.description).toBe("Short meta for sync");
    expect(body.article.canonical_url).toBe("https://example.com/synced-title");
    expect(body.article.main_image).toBe("https://cdn.example/cover-new.webp");
    // P3: schedule / SEO / SyncApp status must never ride along on platform sync.
    for (const field of PLATFORM_SYNC.LOCAL_ONLY_ON_SAVE) {
      expect(body.article).not.toHaveProperty(field);
    }
  });

  it("syncPublishedPostToDevto returns false when credential missing", async () => {
    credentialFindOne.mockResolvedValue(null);
    const post = mockPost({
      _id: "p1",
      platform_status: {
        devto: { published: true, post_id: "99", url: "https://dev.to/u/slug" },
      },
    } as never);

    const synced = await syncPublishedPostToDevto(post, "user-1");
    expect(synced).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });

  it("syncPublishedPostToDevto returns false and does not throw on API failure", async () => {
    credentialFindOne.mockResolvedValue(mockCredential(PLATFORMS.DEVTO));
    vi.mocked(axios.put).mockRejectedValue(new Error("devto unreachable"));

    const post = mockPost({
      _id: "p1",
      platform_status: {
        devto: { published: true, post_id: "99", url: "https://dev.to/u/slug" },
      },
    } as never);

    const synced = await syncPublishedPostToDevto(post, "user-1");
    expect(synced).toBe(false);
  });

  it("syncPublishedCoverToDevto delegates to syncPublishedPostToDevto", async () => {
    const synced = await syncPublishedCoverToDevto(mockPost({ _id: "p1" } as never), "user-1");
    expect(synced).toBe(false);
    expect(credentialFindOne).not.toHaveBeenCalled();
  });

  it("publishToWordpress creates remote post as draft when site_url is set", async () => {
    vi.mocked(axios.post).mockImplementation(async (url: string) => {
      if (typeof url === "string" && url.includes("/tags")) {
        return { data: { id: 1 } };
      }
      return { data: { id: 12, link: "https://wp.test/post/12" } };
    });

    const credential = mockCredential(PLATFORMS.WORDPRESS);
    const result = await publishToWordpress(mockPost(), credential);
    expect(result.action).toBe("create");
    expect(result.updates[`platform_status.wordpress.published`]).toBe(true);
    const createCall = vi.mocked(axios.post).mock.calls.find(([url]) => String(url).includes("/posts"));
    expect(createCall).toBeTruthy();
    const [, wpBody] = createCall as [string, Record<string, unknown>];
    expect(wpBody.status).toBe("draft");
    const headers = createCall?.[2] as { headers?: Record<string, string> } | undefined;
    expect(headers?.headers?.Authorization?.startsWith("Basic ")).toBe(true);
    for (const field of PLATFORM_SYNC.LOCAL_ONLY_ON_SAVE) {
      if (field === "status") {
        continue;
      }
      expect(wpBody).not.toHaveProperty(field);
    }
  });

  it("syncPublishedPostToWordpress no-ops when post is not live on WordPress", async () => {
    const synced = await syncPublishedPostToWordpress(mockPost({ _id: "p1" } as never), "user-1");
    expect(synced).toBe(false);
    expect(credentialFindOne).not.toHaveBeenCalled();
    expect(axios.put).not.toHaveBeenCalled();
  });

  it("syncPublishedPostToWordpress PUTs title body tag IDs when already published", async () => {
    credentialFindOne.mockResolvedValue(mockCredential(PLATFORMS.WORDPRESS));
    vi.mocked(axios.get).mockResolvedValue({
      data: [
        { id: 7, name: "wordpress", slug: "wordpress" },
        { id: 8, name: "sync", slug: "sync" },
      ],
    });
    vi.mocked(axios.put).mockResolvedValue({
      data: { id: 12, link: "https://wp.test/post/12" },
    });

    const post = mockPost({
      _id: "p1",
      title: "Synced WP title",
      content_markdown: "## Updated WP body",
      tags: ["wordpress", "sync"],
      platform_status: {
        wordpress: { published: true, post_id: "12", url: "https://wp.test/post/12" },
      },
    } as never);

    const synced = await syncPublishedPostToWordpress(post, "user-1");
    expect(synced).toBe(true);
    expect(axios.put).toHaveBeenCalledOnce();
    const [, body] = vi.mocked(axios.put).mock.calls[0] as [
      string,
      { title?: string; content?: string; tags?: number[]; featured_media?: number; status?: string },
    ];
    expect(body.title).toBe("Synced WP title");
    expect(body.content).toContain("<h2>");
    expect(body.tags).toEqual([7, 8]);
    expect(body.status).toBe("publish");
    expect(body.featured_media).toBeUndefined();
  });

  it("syncPublishedPostToWordpress uploads cover and sets featured_media", async () => {
    credentialFindOne.mockResolvedValue(mockCredential(PLATFORMS.WORDPRESS));
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (String(url).includes("/tags")) {
        return { data: [] };
      }
      return {
        data: Buffer.from("fake-image-bytes"),
        headers: { "content-type": "image/webp" },
      };
    });
    vi.mocked(axios.post).mockResolvedValue({
      data: { id: 55 },
    });
    vi.mocked(axios.put).mockResolvedValue({
      data: { id: 12, link: "https://wp.test/post/12" },
    });

    const post = mockPost({
      _id: "p1",
      cover_image: "https://cdn.example/cover-new.webp",
      platform_status: {
        wordpress: { published: true, post_id: "12", url: "https://wp.test/post/12" },
      },
    } as never);

    const synced = await syncPublishedPostToWordpress(post, "user-1");
    expect(synced).toBe(true);
    expect(axios.get).toHaveBeenCalledWith(
      "https://cdn.example/cover-new.webp",
      expect.objectContaining({ responseType: "arraybuffer" }),
    );
    expect(axios.post).toHaveBeenCalled();
    expect(axios.put).toHaveBeenCalledOnce();
    const [, body] = vi.mocked(axios.put).mock.calls[0] as [string, { featured_media?: number }];
    expect(body.featured_media).toBe(55);
  });

  it("syncPublishedPostToWordpress skips data: cover URLs for featured_media", async () => {
    credentialFindOne.mockResolvedValue(mockCredential(PLATFORMS.WORDPRESS));
    vi.mocked(axios.put).mockResolvedValue({
      data: { id: 12, link: "https://wp.test/post/12" },
    });

    const post = mockPost({
      _id: "p1",
      cover_image: "data:image/png;base64,abc",
      platform_status: {
        wordpress: { published: true, post_id: "12", url: "https://wp.test/post/12" },
      },
    } as never);

    const synced = await syncPublishedPostToWordpress(post, "user-1");
    expect(synced).toBe(true);
    const mediaGets = vi.mocked(axios.get).mock.calls.filter(([url]) => String(url).includes("data:"));
    expect(mediaGets).toHaveLength(0);
    const [, body] = vi.mocked(axios.put).mock.calls[0] as [string, { featured_media?: number }];
    expect(body.featured_media).toBeUndefined();
  });

  it("syncPublishedPostToWordpress returns false when credential missing", async () => {
    credentialFindOne.mockResolvedValue(null);
    const post = mockPost({
      _id: "p1",
      platform_status: {
        wordpress: { published: true, post_id: "12", url: "https://wp.test/post/12" },
      },
    } as never);

    const synced = await syncPublishedPostToWordpress(post, "user-1");
    expect(synced).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });

  it("syncPublishedPostToWordpress returns false and does not throw on API failure", async () => {
    credentialFindOne.mockResolvedValue(mockCredential(PLATFORMS.WORDPRESS));
    vi.mocked(axios.put).mockRejectedValue(new Error("wp unreachable"));

    const post = mockPost({
      _id: "p1",
      platform_status: {
        wordpress: { published: true, post_id: "12", url: "https://wp.test/post/12" },
      },
    } as never);

    const synced = await syncPublishedPostToWordpress(post, "user-1");
    expect(synced).toBe(false);
  });

  it("documents WordPress SEO meta sync as plugin-dependent blocker", () => {
    expect(PLATFORM_SYNC.WORDPRESS_SEO_META_SYNC).toBe("unsupported_needs_seo_plugin");
  });

  it("publishToLinkedin posts UGC when summary is present", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { id: "urn:li:share:1" },
      headers: {},
    });

    const post = mockPost({
      linkedin_post: "Teaser copy for LinkedIn",
      canonical_url: "https://blog.test/my-slug",
      cover_image: "https://cdn.example/cover.webp",
    } as Partial<IPostDocument>);

    const result = await publishToLinkedin(post, mockCredential(PLATFORMS.LINKEDIN));
    expect(result.action).toBe("create");
    expect(axios.post).toHaveBeenCalledOnce();
    const [, payload] = vi.mocked(axios.post).mock.calls[0] as [
      string,
      {
        specificContent: Record<string, { shareMediaCategory?: string; shareCommentary?: { text?: string } }>;
      },
    ];
    const shareContent = Object.values(payload.specificContent)[0];
    // P3: LinkedIn cover not applicable — text UGC only (MEDIA_CATEGORY_NONE).
    expect(PLATFORM_SYNC.LINKEDIN_COVER_SYNC).toBe("not_applicable");
    expect(shareContent.shareMediaCategory).toBe("NONE");
    expect(JSON.stringify(payload)).not.toContain("https://cdn.example/cover.webp");
  });

  it("publishToLinkedin uses update action when already published (new share, not edit-in-place)", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { id: "urn:li:share:2" },
      headers: {},
    });

    const post = mockPost({
      linkedin_post: "Updated teaser for LinkedIn",
      platform_status: {
        linkedin: {
          published: true,
          post_id: "urn:li:share:1",
          url: "https://www.linkedin.com/feed/update/urn:li:share:1",
        },
      },
    } as Partial<IPostDocument>);

    const result = await publishToLinkedin(post, mockCredential(PLATFORMS.LINKEDIN));
    expect(result.action).toBe("update");
    expect(axios.post).toHaveBeenCalledOnce();
    expect(axios.put).not.toHaveBeenCalled();
  });

  it("publishToLinkedin rejects empty summary", async () => {
    await expect(publishToLinkedin(mockPost(), mockCredential(PLATFORMS.LINKEDIN))).rejects.toThrow(
      ERROR_MESSAGES.LINKEDIN_SUMMARY_REQUIRED,
    );
  });

  it("syncPublishedPostToMedium is a no-op that returns false (Medium create-only API)", async () => {
    const synced = await syncPublishedPostToMedium(mockPost({ _id: "p1" } as never), "user-1");
    expect(synced).toBe(false);
  });

  it("syncPublishedCoverToLinkedin is a no-op that returns false (UGC cover N/A)", async () => {
    const synced = await syncPublishedCoverToLinkedin(mockPost({ _id: "p1" } as never), "user-1");
    expect(synced).toBe(false);
  });
});
