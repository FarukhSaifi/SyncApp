import { POST_STATUS } from "@constants";
import { ForbiddenError, NotFoundError } from "@middleware/errorHandler";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.fn();
const mockFindById = vi.fn();
const mockFindByIdAndDelete = vi.fn();
const mockFindByIdAndUpdate = vi.fn();
const mockFindOne = vi.fn();
const mockFind = vi.fn();
const mockCountDocuments = vi.fn();

vi.mock("@models/Post", () => ({
  default: {
    create: (...args: unknown[]) => mockCreate(...args),
    findById: (...args: unknown[]) => mockFindById(...args),
    findByIdAndDelete: (...args: unknown[]) => mockFindByIdAndDelete(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
    findOne: (...args: unknown[]) => mockFindOne(...args),
    find: (...args: unknown[]) => mockFind(...args),
    countDocuments: (...args: unknown[]) => mockCountDocuments(...args),
  },
}));

vi.mock("./storage", () => ({
  uploadToGCS: vi.fn(async (_buf: Buffer, name: string) => `https://cdn.example/${name}`),
}));

import { createPost, deletePost, getPostById, getPostBySlug, getPosts, updatePost } from "./postsService";

describe("postsService (mocked Post model)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createPost rejects missing title or content", async () => {
    await expect(createPost({ title: "", content_markdown: "x", author: "u1" })).rejects.toThrow();
    await expect(createPost({ title: "Title ok here", content_markdown: "", author: "u1" })).rejects.toThrow();
  });

  it("createPost uploads base64 cover and inline markdown images", async () => {
    const tinyPng =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    mockCreate.mockResolvedValue({ _id: "post-cover" });
    mockFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue({ _id: "post-cover", title: "Cover post title" }),
    });
    await createPost({
      title: "Cover post title for tests",
      content_markdown: `Intro\n\n![inline](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==)\n`,
      author: "user-1",
      cover_image: tinyPng,
    });
    const { uploadToGCS } = await import("./storage");
    expect(vi.mocked(uploadToGCS).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("createPost persists draft and returns populated document", async () => {
    mockCreate.mockResolvedValue({ _id: "post-1" });
    mockFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: "post-1",
        title: "My draft title for tests",
        status: POST_STATUS.DRAFT,
      }),
    });

    const post = await createPost({
      title: "My draft title for tests",
      content_markdown: "## Body",
      author: "user-1",
    });

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(post?.title).toBe("My draft title for tests");
  });

  it("getPostById throws NotFoundError when missing", async () => {
    mockFindById.mockReturnValue({
      populate: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    });
    await expect(getPostById("missing")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("getPostById throws ForbiddenError for private draft without owner", async () => {
    mockFindById.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "p1",
          status: POST_STATUS.DRAFT,
          author: { _id: { toString: () => "owner-1" } },
        }),
      }),
    });
    await expect(getPostById("p1", "other-user")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("getPosts applies search filter and scheduled status", async () => {
    mockCountDocuments.mockResolvedValue(2);
    mockFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([
                  {
                    _id: "p-sched",
                    title: "Scheduled item",
                    status: POST_STATUS.DRAFT,
                    scheduled_for: new Date(Date.now() + 86_400_000),
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
    const result = await getPosts({
      userId: "user-1",
      page: "1",
      limit: "10",
      status: "scheduled",
      search: "Scheduled",
    });
    expect(result.data).toHaveLength(1);
    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({ scheduled_for: expect.any(Object) }));
  });

  it("getPosts returns paginated list for user", async () => {
    mockCountDocuments.mockResolvedValue(1);
    mockFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([
                  {
                    _id: "p1",
                    title: "Listed",
                    status: POST_STATUS.DRAFT,
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

    const result = await getPosts({ userId: "user-1", page: "1", limit: "10" });
    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it("updatePost rejects non-owner", async () => {
    mockFindById.mockResolvedValue({
      author: { toString: () => "owner-1" },
      slug: "slug",
      title: "T",
      status: POST_STATUS.DRAFT,
    });
    await expect(updatePost("p1", { title: "X" }, "other")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("getPostBySlug returns public published post without owner", async () => {
    mockFindOne.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "p-slug",
          slug: "public-post",
          status: POST_STATUS.PUBLISHED,
          author: { _id: { toString: () => "owner-1" } },
        }),
      }),
    });
    const post = await getPostBySlug("public-post");
    expect(post?.slug).toBe("public-post");
  });

  it("updatePost applies allowed fields for owner", async () => {
    mockFindById.mockResolvedValue({
      author: { toString: () => "owner-1" },
      slug: "slug",
      title: "Old",
      status: POST_STATUS.DRAFT,
    });
    mockFindByIdAndUpdate.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: "p1", title: "New title here" }),
      }),
    });
    const updated = await updatePost("p1", { title: "New title here" }, "owner-1");
    expect(updated?.title).toBe("New title here");
  });

  it("deletePost removes owned post", async () => {
    mockFindById.mockResolvedValue({
      author: { toString: () => "owner-1" },
      slug: "slug",
    });
    mockFindByIdAndDelete.mockResolvedValue({});

    await deletePost("p1", "owner-1");
    expect(mockFindByIdAndDelete).toHaveBeenCalledWith("p1");
  });

  it("deletePost throws NotFoundError when post missing", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(deletePost("missing", "owner-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deletePost throws ForbiddenError for non-owner", async () => {
    mockFindById.mockResolvedValue({
      author: { toString: () => "owner-1" },
      slug: "slug",
    });
    await expect(deletePost("p1", "other-user")).rejects.toBeInstanceOf(ForbiddenError);
  });
});
