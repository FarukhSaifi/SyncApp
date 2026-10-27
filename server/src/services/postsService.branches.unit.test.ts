import { config } from "@config";
import { POST_STATUS } from "@constants";
import { ForbiddenError, NotFoundError } from "@middleware/errorHandler";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.fn();
const mockFind = vi.fn();
const mockFindOne = vi.fn();
const mockFindById = vi.fn();
const mockFindByIdAndUpdate = vi.fn();
const mockFindByIdAndDelete = vi.fn();
const mockCountDocuments = vi.fn();
const cacheGet = vi.hoisted(() => vi.fn());
const cacheSet = vi.hoisted(() => vi.fn());
const cacheDelete = vi.hoisted(() => vi.fn());
const cacheInvalidatePattern = vi.hoisted(() => vi.fn());

vi.mock("@models/Post", () => ({
  default: {
    create: (...args: unknown[]) => mockCreate(...args),
    find: (...args: unknown[]) => mockFind(...args),
    findOne: (...args: unknown[]) => mockFindOne(...args),
    findById: (...args: unknown[]) => mockFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
    findByIdAndDelete: (...args: unknown[]) => mockFindByIdAndDelete(...args),
    countDocuments: (...args: unknown[]) => mockCountDocuments(...args),
  },
}));

vi.mock("@utils/cache", () => ({
  cache: {
    get: (...args: unknown[]) => cacheGet(...args),
    set: (...args: unknown[]) => cacheSet(...args),
    delete: (...args: unknown[]) => cacheDelete(...args),
    invalidatePattern: (...args: unknown[]) => cacheInvalidatePattern(...args),
  },
  cacheKeys: {
    posts: {
      slug: (slug: string) => `post-slug:${slug}`,
      single: (id: string) => `post-id:${id}`,
      all: () => "posts:all",
      list: (...parts: (string | number)[]) => `posts:list:${parts.join(":")}`,
      stats: (userId: string) => `posts:stats:${userId}`,
    },
  },
}));

vi.mock("./storage", () => ({
  uploadToGCS: vi.fn(async () => "https://cdn.example/file.png"),
}));

import { createPost, deletePost, getPostById, getPostBySlug, getPosts, updatePost } from "./postsService";

describe("postsService branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheGet.mockReturnValue(undefined);
  });

  it("getPostBySlug returns cached published post without hitting db", async () => {
    cacheGet.mockReturnValue({
      _id: "p1",
      slug: "my-slug",
      status: POST_STATUS.PUBLISHED,
      title: "Cached",
      author: { _id: { toString: () => "owner" } },
    });
    const post = await getPostBySlug("my-slug");
    expect(post.title).toBe("Cached");
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it("getPostBySlug rejects cached draft for non-owner", async () => {
    cacheGet.mockReturnValue({
      _id: "p1",
      slug: "draft-slug",
      status: POST_STATUS.DRAFT,
      author: { _id: { toString: () => "owner" } },
    });
    await expect(getPostBySlug("draft-slug", "other-user")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("getPostBySlug loads from db and caches published post", async () => {
    mockFindOne.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "p2",
          slug: "live-slug",
          status: POST_STATUS.PUBLISHED,
          title: "Live",
          author: { _id: { toString: () => "owner" } },
          content_markdown: "body",
        }),
      }),
    });
    const post = await getPostBySlug("live-slug");
    expect(post.title).toBe("Live");
    expect(cacheSet).toHaveBeenCalledOnce();
  });

  it("getPostBySlug throws NotFoundError when slug missing", async () => {
    mockFindOne.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    });
    await expect(getPostBySlug("missing-slug")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("getPostById returns cached draft for owner", async () => {
    cacheGet.mockReturnValue({
      _id: "p-cache",
      status: POST_STATUS.DRAFT,
      author: { _id: { toString: () => "owner-1" } },
      title: "Cached draft",
    });
    const post = await getPostById("p-cache", "owner-1");
    expect(post.title).toBe("Cached draft");
    expect(mockFindById).not.toHaveBeenCalled();
  });

  it("getPostById hydrates firebase cover urls from db", async () => {
    config.canonicalBaseUrl = "https://blog.example.com";
    mockFindById.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "p3",
          status: POST_STATUS.PUBLISHED,
          title: "Hydrated",
          author: { _id: { toString: () => "owner" } },
          cover_image: "https://storage.googleapis.com/syncapp-9ab7f.firebasestorage.app/uploads/cover.png",
          content_markdown: "See https://storage.googleapis.com/syncapp-9ab7f.firebasestorage.app/uploads/a.png",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }),
    });
    const post = await getPostById("p3");
    expect(post.cover_image).toContain("firebasestorage.googleapis.com");
    expect(cacheSet).toHaveBeenCalled();
  });

  it("getPosts returns cached list and backfills stats", async () => {
    cacheGet.mockImplementation((key: string) => {
      if (String(key).includes("posts:stats:")) {
        return undefined;
      }
      return {
        data: [{ _id: "p1", title: "Cached list" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
    });
    mockCountDocuments.mockResolvedValue(3);
    const result = await getPosts({ userId: "owner-1", page: "1", limit: "10" });
    expect(result.data[0].title).toBe("Cached list");
    expect(result.stats?.total).toBe(3);
  });

  it("createPost stores schedule and seo fields", async () => {
    mockCreate.mockResolvedValue({ _id: "new-post" });
    mockFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue({ _id: "new-post", title: "Scheduled draft title" }),
    });
    await createPost({
      title: "Scheduled draft title",
      content_markdown: "## Body\n\nContent",
      author: "owner-1",
      scheduled_for: new Date(Date.now() + 86_400_000).toISOString(),
      scheduled_platforms: ["devto"],
      seo_primary_keyword: "syncapp seo",
      seo_optimization_targets: ["devto"],
    });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ scheduled_for: expect.any(Date) }));
    expect(cacheInvalidatePattern).toHaveBeenCalled();
  });

  it("getPosts lists published posts for anonymous readers", async () => {
    mockCountDocuments.mockResolvedValue(1);
    mockFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([
                  {
                    _id: "pub-1",
                    title: "Public",
                    status: POST_STATUS.PUBLISHED,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ]),
              }),
            }),
          }),
        }),
      }),
    });
    const result = await getPosts({ page: "1", limit: "10" });
    expect(result.data).toHaveLength(1);
    expect(result.stats?.total).toBe(0);
    expect(mockFind).toHaveBeenCalledWith({ status: POST_STATUS.PUBLISHED });
  });

  it("getPostBySlug rejects draft loaded from db without owner", async () => {
    mockFindOne.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "draft-db",
          slug: "draft-db",
          status: POST_STATUS.DRAFT,
          author: { _id: { toString: () => "owner" } },
        }),
      }),
    });
    await expect(getPostBySlug("draft-db")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("createPost normalizes scheduled_platforms without scheduled_for", async () => {
    mockCreate.mockResolvedValue({ _id: "sched-platforms-only" });
    mockFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue({ _id: "sched-platforms-only" }),
    });
    await createPost({
      title: "Platforms only schedule title",
      content_markdown: "## Body",
      author: "owner-1",
      scheduled_platforms: ["devto"],
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduled_platforms: expect.any(Array),
      }),
    );
  });

  it("createPost keeps markdown when inline image upload fails", async () => {
    const { uploadToGCS } = await import("./storage");
    vi.mocked(uploadToGCS)
      .mockRejectedValueOnce(new Error("upload failed"))
      .mockResolvedValue("https://cdn.example/cover.png");
    mockCreate.mockResolvedValue({ _id: "inline-fail" });
    mockFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue({ _id: "inline-fail" }),
    });
    await createPost({
      title: "Inline fail upload title",
      content_markdown:
        "![bad](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==)",
      author: "owner-1",
    });
    const payload = mockCreate.mock.calls[0][0] as { content_markdown: string };
    expect(payload.content_markdown).toContain("data:image/png");
  });

  it("deletePost throws when post missing or caller is not owner", async () => {
    mockFindById.mockResolvedValueOnce(null);
    await expect(deletePost("missing", "owner-1")).rejects.toBeInstanceOf(NotFoundError);

    mockFindById.mockResolvedValueOnce({
      author: { toString: () => "owner-1" },
      slug: "s",
    });
    await expect(deletePost("p1", "other")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("getPostById leaves non-firebase GCS urls unchanged", async () => {
    mockFindById.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "gcs-plain",
          status: POST_STATUS.PUBLISHED,
          title: "GCS plain",
          author: { _id: { toString: () => "owner" } },
          cover_image: "https://storage.googleapis.com/plain-bucket/uploads/cover.png",
          content_markdown: "See https://storage.googleapis.com/plain-bucket/uploads/a.png",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }),
    });
    const post = await getPostById("gcs-plain");
    expect(post.cover_image).toContain("storage.googleapis.com/plain-bucket");
  });

  it("updatePost applies content, tags, linkedin, schedule, and seo fields", async () => {
    config.canonicalBaseUrl = "https://blog.example.com";
    mockFindById.mockResolvedValue({
      author: { toString: () => "owner-1" },
      slug: "old-slug",
      title: "Old title",
      content_markdown: "## Old",
      status: POST_STATUS.DRAFT,
      scheduled_for: new Date(Date.now() + 86_400_000),
      scheduled_platforms: ["devto"],
      tags: ["a"],
      meta_description: "",
      cover_image: "",
      canonical_url: "",
      seo_primary_keyword: "old kw",
      seo_optimization_targets: ["google"],
    });
    mockFindByIdAndUpdate.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: "p1", title: "New title" }),
      }),
    });

    await updatePost(
      "p1",
      {
        content_markdown: "## Updated\n\nBody",
        status: POST_STATUS.DRAFT,
        tags: ["nextjs", "seo"],
        linkedin_post: "LinkedIn teaser copy",
        linkedin_read_more_url: " https://blog.example.com/read ",
        slug: "new-slug",
        scheduled_platforms: ["devto", "medium"],
        seo_primary_keyword: "nextjs seo",
        seo_optimization_targets: ["google"],
      },
      "owner-1",
    );
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        content_markdown: expect.stringContaining("Updated"),
        linkedin_post: "LinkedIn teaser copy",
        linkedin_read_more_url: "https://blog.example.com/read",
        slug: "new-slug",
        seo_primary_keyword: "nextjs seo",
      }),
      expect.any(Object),
    );
  });

  it("getPosts applies draft status filter for owner", async () => {
    mockCountDocuments.mockResolvedValue(0);
    mockFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
    });
    await getPosts({ userId: "owner-1", status: POST_STATUS.DRAFT, page: "1", limit: "10" });
    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({ status: POST_STATUS.DRAFT }));
  });

  it("updatePost throws when post is missing", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(updatePost("missing", { title: "X" }, "owner-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("updatePost keeps explicit canonical url when provided", async () => {
    mockFindById.mockResolvedValue({
      author: { toString: () => "owner-1" },
      slug: "slug-a",
      title: "Title",
      status: POST_STATUS.DRAFT,
    });
    mockFindByIdAndUpdate.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: "p1", canonical_url: "https://custom.example/post" }),
      }),
    });
    await updatePost("p1", { canonical_url: "https://custom.example/post" }, "owner-1");
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ canonical_url: "https://custom.example/post" }),
      expect.any(Object),
    );
  });

  it("updatePost applies meta and schedule fields for owner", async () => {
    mockFindById.mockResolvedValue({
      author: { toString: () => "owner-1" },
      slug: "slug-a",
      title: "Old title",
      content_markdown: "## Body",
      status: POST_STATUS.DRAFT,
      scheduled_for: null,
      scheduled_platforms: [],
      tags: [],
      meta_description: "",
      cover_image: "",
      canonical_url: "",
    });
    mockFindByIdAndUpdate.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "p1",
          title: "New title",
          meta_description: "Meta",
          status: POST_STATUS.DRAFT,
        }),
      }),
    });

    const updated = await updatePost(
      "p1",
      {
        title: "New title",
        meta_description: "  Meta  ",
        scheduled_for: null,
      },
      "owner-1",
    );
    expect(updated?.title).toBe("New title");
    expect(mockFindByIdAndUpdate).toHaveBeenCalledOnce();
  });
});
