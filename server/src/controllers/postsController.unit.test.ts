import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

const postsServiceMocks = vi.hoisted(() => ({
  createPost: vi.fn(async (body: unknown) => body),
  getPosts: vi.fn(async () => ({ data: [], total: 0 })),
  getPostById: vi.fn(async () => ({ id: "p1" })),
  getPostBySlug: vi.fn(async () => ({ id: "p1" })),
  updatePost: vi.fn(async () => ({ id: "p1", cover_image: "https://cdn/cover.png" })),
  deletePost: vi.fn(async () => undefined),
}));

const uploadToGCS = vi.hoisted(() => vi.fn(async () => "https://cdn/cover.png"));

vi.mock("@services/postsService", () => postsServiceMocks);
vi.mock("@services/storage", () => ({ uploadToGCS }));

const postFindById = vi.hoisted(() => vi.fn());

vi.mock("@models/Post", () => ({
  default: {
    findById: postFindById,
  },
}));

import { createPost, getPosts, uploadPostCover } from "./postsController";

describe("postsController", () => {
  const userId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
    postFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        slug: "my-post",
        title: "My Post",
        author: new mongoose.Types.ObjectId(userId),
      }),
    });
  });

  it("createPost returns 201 with service payload", async () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await createPost({ body: { title: "T" }, userId } as never, { status, json } as never, vi.fn());
    expect(status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
    expect(postsServiceMocks.createPost).toHaveBeenCalledWith(expect.objectContaining({ author: userId }));
  });

  it("getPosts spreads paginated service result", async () => {
    const json = vi.fn();
    await getPosts({ query: { page: "1" }, userId } as never, { json } as never, vi.fn());
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [] }));
  });

  async function expectHandlerRejects(
    handler: (req: never, res: never, next: (err?: unknown) => void) => unknown,
    req: unknown,
    message: string,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      handler(req as never, {} as never, (err) => {
        try {
          expect(err).toMatchObject({ message });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  it("uploadPostCover rejects missing image payload", async () => {
    await expectHandlerRejects(
      uploadPostCover as (req: never, res: never, next: (err?: unknown) => void) => unknown,
      { params: { id: "p1" }, body: {}, userId },
      ERROR_MESSAGES.UPLOAD_IMAGE_DATA_URL_REQUIRED,
    );
  });

  it("uploadPostCover rejects unknown posts and foreign authors", async () => {
    postFindById.mockReturnValueOnce({ select: vi.fn().mockResolvedValue(null) });
    await expectHandlerRejects(
      uploadPostCover as (req: never, res: never, next: (err?: unknown) => void) => unknown,
      { params: { id: "p1" }, body: { image: "data:image/png;base64,abc" }, userId },
      ERROR_MESSAGES.POST_NOT_FOUND,
    );

    postFindById.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({
        slug: "slug",
        title: "Title",
        author: new mongoose.Types.ObjectId(),
      }),
    });
    await expectHandlerRejects(
      uploadPostCover as (req: never, res: never, next: (err?: unknown) => void) => unknown,
      { params: { id: "p1" }, body: { image: "data:image/png;base64,abc" }, userId },
      ERROR_MESSAGES.ACCESS_DENIED_POST,
    );
  });

  it("uploadPostCover uploads cover and returns url", async () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const png = Buffer.from("png").toString("base64");
    const next = vi.fn();
    uploadPostCover(
      {
        params: { id: "p1" },
        body: { image: `data:image/png;base64,${png}` },
        userId,
      } as never,
      { status, json } as never,
      next,
    );
    await vi.waitFor(() => {
      expect(json).toHaveBeenCalledOnce();
    });
    expect(uploadToGCS).toHaveBeenCalledOnce();
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ url: expect.stringContaining("https://") }) }),
    );
  });
});
