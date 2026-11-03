import { ERROR_MESSAGES, PLATFORMS } from "@constants";
import type { ICredentialDocument } from "@models/Credential";
import type { IPostDocument } from "@models/Post";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WORDPRESS } from "@constants/wordpress";

vi.mock("axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

vi.mock("@utils/encryption", () => ({
  decryptCredential: vi.fn(() => "app-password"),
}));

const credentialFindOne = vi.hoisted(() => vi.fn());
const postFindOne = vi.hoisted(() => vi.fn());
const postFindOneAndUpdate = vi.hoisted(() => vi.fn());
const postFindById = vi.hoisted(() => vi.fn());
const postUpdateOne = vi.hoisted(() => vi.fn());

vi.mock("@models/Credential", () => ({
  default: {
    findOne: (...args: unknown[]) => credentialFindOne(...args),
  },
}));

vi.mock("@models/Post", () => ({
  default: {
    findOne: (...args: unknown[]) => postFindOne(...args),
    findOneAndUpdate: (...args: unknown[]) => postFindOneAndUpdate(...args),
    findById: (...args: unknown[]) => postFindById(...args),
    updateOne: (...args: unknown[]) => postUpdateOne(...args),
  },
}));

import {
  linkExistingWordpressPost,
  publishToWordpress,
  resetWordpressTestConnectionRateLimitForTests,
  searchWordpressPostsForLink,
  testWordpressConnection,
} from "./wordpressService";

function mockWpCredential(extra: Partial<ICredentialDocument> = {}): ICredentialDocument {
  return {
    platform_name: PLATFORMS.WORDPRESS,
    site_url: "https://farukhsaifi.wordpress.com",
    encrypted_payload: "enc",
    api_key: "enc",
    platform_config: { wordpress_username: "farukh" },
    ...extra,
  } as ICredentialDocument;
}

function mockWpPost(overrides: Partial<IPostDocument> = {}): IPostDocument {
  return {
    _id: "p1",
    title: "WP title",
    content_markdown: "Body",
    tags: [],
    slug: "wp-title",
    platform_status: {},
    ...overrides,
  } as IPostDocument;
}

describe("wordpressService link + test + publish safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetWordpressTestConnectionRateLimitForTests();
    credentialFindOne.mockResolvedValue(mockWpCredential());
    postFindById.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    });
    postFindOneAndUpdate.mockResolvedValue({ _id: "p1" });
    postUpdateOne.mockResolvedValue({ acknowledged: true });
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
  });

  it("linkExistingWordpressPost requires confirm and blocks ownership conflicts", async () => {
    await expect(linkExistingWordpressPost("u1", "p1", "3", false)).rejects.toThrow(
      ERROR_MESSAGES.WORDPRESS_LINK_CONFIRM_REQUIRED,
    );

    postFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: "other", title: "Taken" }) }),
    });
    await expect(linkExistingWordpressPost("u1", "p1", "3", true, "manual")).rejects.toThrow(
      ERROR_MESSAGES.WORDPRESS_LINK_CONFLICT,
    );
  });

  it("linkExistingWordpressPost writes platform_status on confirm", async () => {
    postFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    });
    vi.mocked(axios.get).mockResolvedValue({
      data: { id: 3, link: "https://farukhsaifi.wordpress.com/2019/01/27/farukh/" },
    });
    postFindOneAndUpdate.mockResolvedValue({ _id: "p1" });

    const updates = await linkExistingWordpressPost("u1", "p1", "3", true, "matched_slug");
    expect(updates["platform_status.wordpress.post_id"]).toBe("3");
    expect(updates["platform_status.wordpress.link_method"]).toBe(WORDPRESS.LINK_METHODS.MATCHED_SLUG);
    expect(String(vi.mocked(axios.get).mock.calls[0][0])).toContain("public-api.wordpress.com");
  });

  it("linkExistingWordpressPost rejects creating sentinel as remote id", async () => {
    await expect(linkExistingWordpressPost("u1", "p1", WORDPRESS.CREATING_POST_ID, true, "manual")).rejects.toThrow(
      ERROR_MESSAGES.WORDPRESS_LINK_REMOTE_ID_REQUIRED,
    );
  });

  it("searchWordpressPostsForLink prefers slug matches and skips title when slug hits", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: [
        {
          id: 11,
          slug: "hello-world",
          link: "https://farukhsaifi.wordpress.com/hello-world/",
          date: "2024-01-01T00:00:00",
          title: { rendered: "Hello World" },
        },
      ],
    });

    const candidates = await searchWordpressPostsForLink("u1", {
      slug: "hello-world",
      title: "Hello World",
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ id: 11, match: "slug", slug: "hello-world" });
    expect(vi.mocked(axios.get)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(axios.get).mock.calls[0][1]).toMatchObject({
      params: { slug: "hello-world", per_page: WORDPRESS.SEARCH.MAX_CANDIDATES },
    });
  });

  it("searchWordpressPostsForLink falls back to title when slug misses", async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [
          {
            id: 22,
            slug: "other",
            link: "https://farukhsaifi.wordpress.com/other/",
            date: "2024-02-01T00:00:00",
            title: { rendered: "Hello World" },
          },
        ],
      });

    const candidates = await searchWordpressPostsForLink("u1", {
      slug: "missing-slug",
      title: "Hello World",
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ id: 22, match: "title", title: "Hello World" });
    expect(vi.mocked(axios.get)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(axios.get).mock.calls[1][1]).toMatchObject({
      params: { search: "Hello World", per_page: WORDPRESS.SEARCH.MAX_CANDIDATES },
    });
  });

  it("testWordpressConnection rate-limits repeated calls", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    await testWordpressConnection("user-rate");
    for (let i = 0; i < WORDPRESS.TEST_CONNECTION.MAX_PER_WINDOW - 1; i += 1) {
      await testWordpressConnection("user-rate");
    }
    await expect(testWordpressConnection("user-rate")).rejects.toThrow(ERROR_MESSAGES.WORDPRESS_TEST_RATE_LIMITED);
  });

  it("testWordpressConnection returns generic failure without leaking secrets", async () => {
    vi.mocked(axios.get).mockRejectedValue(
      new Error("Request failed with Basic YWxpY2U6c2VjcmV0 Authorization: Bearer leak.token"),
    );
    try {
      await testWordpressConnection("user-fail");
      expect.fail("expected testWordpressConnection to reject");
    } catch (err) {
      expect((err as Error).message).toBe(ERROR_MESSAGES.WORDPRESS_TEST_FAILED);
      expect((err as Error).message).not.toMatch(/Basic|Bearer|leak/i);
    }
  });

  it("publishToWordpress PUTs when post_id already exists", async () => {
    vi.mocked(axios.put).mockResolvedValue({ data: { id: 9, link: "https://wp.test/9" } });
    const result = await publishToWordpress(
      mockWpPost({
        platform_status: { wordpress: { published: true, post_id: "9", url: "https://wp.test/9" } },
      } as Partial<IPostDocument>),
      mockWpCredential({ site_url: "https://wp.test" }),
    );
    expect(result.action).toBe("update");
    expect(axios.put).toHaveBeenCalledOnce();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("publishToWordpress claims __creating__ then POSTs on create", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 42, link: "https://wp.test/42" } });
    const result = await publishToWordpress(mockWpPost(), mockWpCredential({ site_url: "https://wp.test" }));
    expect(result.action).toBe("create");
    expect(postFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "p1" }),
      expect.objectContaining({
        $set: expect.objectContaining({
          "platform_status.wordpress.post_id": WORDPRESS.CREATING_POST_ID,
        }),
      }),
      expect.any(Object),
    );
    const createCall = vi.mocked(axios.post).mock.calls.find(([url]) => String(url).includes("/posts"));
    expect(createCall).toBeTruthy();
  });

  it("publishToWordpress PUTs when create claim loses race to real post_id", async () => {
    postFindOneAndUpdate.mockResolvedValueOnce(null);
    postFindById
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            platform_status: { wordpress: { post_id: "77" } },
          }),
        }),
      });
    vi.mocked(axios.put).mockResolvedValue({ data: { id: 77, link: "https://wp.test/77" } });

    const result = await publishToWordpress(mockWpPost(), mockWpCredential({ site_url: "https://wp.test" }));
    expect(result.action).toBe("update");
    expect(postFindOneAndUpdate).toHaveBeenCalled();
    expect(axios.put).toHaveBeenCalledOnce();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("publishToWordpress rejects when create claim loses race to __creating__", async () => {
    postFindOneAndUpdate.mockResolvedValueOnce(null);
    postFindById
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            platform_status: { wordpress: { post_id: WORDPRESS.CREATING_POST_ID } },
          }),
        }),
      });

    await expect(publishToWordpress(mockWpPost(), mockWpCredential({ site_url: "https://wp.test" }))).rejects.toThrow(
      ERROR_MESSAGES.WORDPRESS_PUBLISH_IN_PROGRESS,
    );
    expect(postFindOneAndUpdate).toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("publishToWordpress rejects early when DB already has __creating__", async () => {
    postFindById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          platform_status: { wordpress: { post_id: WORDPRESS.CREATING_POST_ID } },
        }),
      }),
    });

    await expect(publishToWordpress(mockWpPost(), mockWpCredential({ site_url: "https://wp.test" }))).rejects.toThrow(
      ERROR_MESSAGES.WORDPRESS_PUBLISH_IN_PROGRESS,
    );
    expect(postFindOneAndUpdate).not.toHaveBeenCalled();
    expect(axios.put).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("publishToWordpress scrubs secrets on create failure and clears claim", async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error("WP failed Basic YWxpY2U6c2VjcmV0"));
    try {
      await publishToWordpress(mockWpPost(), mockWpCredential({ site_url: "https://wp.test" }));
      expect.fail("expected publishToWordpress to reject");
    } catch (err) {
      expect((err as Error).message).toMatch(/REDACTED|WP failed/i);
      expect((err as Error).message).not.toContain("YWxpY2U6c2VjcmV0");
    }
    expect(postUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        "platform_status.wordpress.post_id": WORDPRESS.CREATING_POST_ID,
      }),
      expect.objectContaining({ $unset: expect.any(Object) }),
    );
  });
});
