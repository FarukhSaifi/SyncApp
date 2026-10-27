import { PLATFORMS, POST_STATUS } from "@constants";
import Credential from "@models/Credential";
import Post from "@models/Post";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_MESSAGES } from "@constants/messages";

const publishToDevtoMock = vi.hoisted(() => vi.fn());
const performPublishToAllMock = vi.hoisted(() => vi.fn());

vi.mock("@models/Post", () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock("@models/Credential", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

const publishToMediumMock = vi.hoisted(() => vi.fn());
const publishToWordpressMock = vi.hoisted(() => vi.fn());
const publishToLinkedinMock = vi.hoisted(() => vi.fn());

vi.mock("@services/publishService", () => ({
  publishToMedium: publishToMediumMock,
  publishToDevto: publishToDevtoMock,
  publishToWordpress: publishToWordpressMock,
  publishToLinkedin: publishToLinkedinMock,
  performPublishToAll: performPublishToAllMock,
  platformSuccessMessage: vi.fn(() => "Published ok"),
}));

const unpublishFromPlatformMock = vi.hoisted(() =>
  vi.fn(
    async (): Promise<{
      _id: string;
      platform_status: { devto: { published: boolean } };
    } | null> => ({
      _id: "p3",
      platform_status: { devto: { published: false } },
    }),
  ),
);

vi.mock("@services/platformService", () => ({
  unpublishFromPlatform: unpublishFromPlatformMock,
}));

import {
  publishAll,
  publishDevto,
  publishLinkedin,
  publishMedium,
  publishWordpress,
  statusMedium,
  unpublishPlatform,
} from "./publishController";

function mockRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { json, status, res: { json, status } as never };
}

async function flushAsyncHandlers(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe("publishController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publishToDevtoMock.mockReset();
    performPublishToAllMock.mockReset();
  });

  it("publishDevto forwards validation errors via asyncHandler", async () => {
    const { res } = mockRes();
    const next = vi.fn();
    publishDevto({ body: {}, userId: "user-1" } as never, res, next);
    await flushAsyncHandlers();
    expect(next).toHaveBeenCalledOnce();
  });

  it("publishDevto returns platform status on success", async () => {
    const post = {
      _id: "post-1",
      author: "user-1",
      status: POST_STATUS.DRAFT,
      platform_status: {},
    };
    vi.mocked(Post.findById).mockResolvedValue(post as never);
    vi.mocked(Credential.findOne).mockResolvedValue({ platform_name: PLATFORMS.DEVTO } as never);
    publishToDevtoMock.mockResolvedValue({
      updates: { "platform_status.devto.published": true },
      action: "create",
    });
    vi.mocked(Post.findByIdAndUpdate).mockResolvedValue({
      ...post,
      platform_status: { devto: { published: true } },
    } as never);

    const { res, json } = mockRes();
    const next = vi.fn();
    publishDevto({ body: { postId: "post-1" }, userId: "user-1" } as never, res, next);
    await flushAsyncHandlers();

    expect(next).not.toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ postId: "post-1" }),
      }),
    );
  });

  it("publishAll forwards orchestration result", async () => {
    vi.mocked(Post.findById).mockResolvedValue({ _id: "p1", author: "u1" } as never);
    performPublishToAllMock.mockResolvedValue({
      success: true,
      message: "done",
      post: { _id: "p1" },
      successes: ["devto"],
      errors: undefined,
    });

    const { res, json } = mockRes();
    publishAll({ body: { postId: "p1" }, userId: "u1" } as never, res, vi.fn());
    await flushAsyncHandlers();

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "done" }));
  });

  it("statusMedium returns post status payload", async () => {
    vi.mocked(Post.findById).mockResolvedValue({
      _id: "p2",
      author: "u1",
      status: POST_STATUS.DRAFT,
      platform_status: {},
    } as never);

    const { res, json } = mockRes();
    statusMedium({ params: { postId: "p2" }, userId: "u1" } as never, res, vi.fn());
    await flushAsyncHandlers();
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("publishMedium returns platform status on success", async () => {
    const post = { _id: "post-m", author: "user-1", status: POST_STATUS.DRAFT, platform_status: {} };
    vi.mocked(Post.findById).mockResolvedValue(post as never);
    vi.mocked(Credential.findOne).mockResolvedValue({ platform_name: PLATFORMS.MEDIUM } as never);
    publishToMediumMock.mockResolvedValue({
      updates: { "platform_status.medium.published": true },
      action: "create",
    });
    vi.mocked(Post.findByIdAndUpdate).mockResolvedValue({
      ...post,
      platform_status: { medium: { published: true } },
    } as never);

    const { res, json } = mockRes();
    publishMedium({ body: { postId: "post-m" }, userId: "user-1" } as never, res, vi.fn());
    await flushAsyncHandlers();
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("publishWordpress and publishLinkedin succeed with credentials", async () => {
    const post = { _id: "post-w", author: "user-1", status: POST_STATUS.DRAFT, platform_status: {} };
    vi.mocked(Post.findById).mockResolvedValue(post as never);
    vi.mocked(Credential.findOne).mockResolvedValue({ platform_name: PLATFORMS.WORDPRESS } as never);
    publishToWordpressMock.mockResolvedValue({ updates: {}, action: "update" });
    publishToLinkedinMock.mockResolvedValue({ updates: {}, action: "create" });
    vi.mocked(Post.findByIdAndUpdate).mockResolvedValue({ ...post, platform_status: {} } as never);

    const { res: resW, json: jsonW } = mockRes();
    publishWordpress({ body: { postId: "post-w" }, userId: "user-1" } as never, resW, vi.fn());
    await flushAsyncHandlers();
    expect(jsonW).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    vi.mocked(Credential.findOne).mockResolvedValue({ platform_name: PLATFORMS.LINKEDIN } as never);
    const { res: resL, json: jsonL } = mockRes();
    publishLinkedin({ body: { postId: "post-w" }, userId: "user-1" } as never, resL, vi.fn());
    await flushAsyncHandlers();
    expect(jsonL).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("unpublishPlatform succeeds for devto", async () => {
    vi.mocked(Post.findById).mockResolvedValue({ _id: "p3", author: "u1" } as never);
    const { res, json } = mockRes();
    unpublishPlatform({ params: { postId: "p3", platform: PLATFORMS.DEVTO }, userId: "u1" } as never, res, vi.fn());
    await flushAsyncHandlers();
    expect(unpublishFromPlatformMock).toHaveBeenCalledWith("p3", PLATFORMS.DEVTO);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("unpublishPlatform rejects invalid platform param", async () => {
    vi.mocked(Post.findById).mockResolvedValue({ _id: "p3", author: "u1" } as never);
    const next = vi.fn();
    unpublishPlatform(
      { params: { postId: "p3", platform: "invalid-platform" }, userId: "u1" } as never,
      mockRes().res,
      next,
    );
    await flushAsyncHandlers();
    expect(next).toHaveBeenCalledOnce();
  });

  it("publishDevto rejects when post id does not exist", async () => {
    vi.mocked(Post.findById).mockResolvedValue(null);
    const next = vi.fn();
    publishDevto({ body: { postId: "missing" }, userId: "user-1" } as never, mockRes().res, next);
    await flushAsyncHandlers();
    expect(next).toHaveBeenCalledOnce();
  });

  it("publishDevto rejects missing post and forbidden owner", async () => {
    const next = vi.fn();
    publishDevto({ body: {}, userId: "user-1" } as never, mockRes().res, next);
    await flushAsyncHandlers();
    expect(next).toHaveBeenCalledOnce();

    vi.mocked(Post.findById).mockResolvedValue({
      _id: "post-1",
      author: "other-user",
    } as never);
    const nextForbidden = vi.fn();
    publishDevto({ body: { postId: "post-1" }, userId: "user-1" } as never, mockRes().res, nextForbidden);
    await flushAsyncHandlers();
    expect(nextForbidden).toHaveBeenCalledOnce();
  });

  it("publishDevto forwards missing credential errors", async () => {
    vi.mocked(Post.findById).mockResolvedValue({
      _id: "post-1",
      author: "user-1",
      status: POST_STATUS.DRAFT,
      platform_status: {},
    } as never);
    vi.mocked(Credential.findOne).mockResolvedValue(null);
    const next = vi.fn();
    publishDevto({ body: { postId: "post-1" }, userId: "user-1" } as never, mockRes().res, next);
    await flushAsyncHandlers();
    expect(next).toHaveBeenCalledOnce();
  });

  it("publishDevto throws when updated post missing after publish", async () => {
    const post = { _id: "post-1", author: "user-1", status: POST_STATUS.DRAFT, platform_status: {} };
    vi.mocked(Post.findById).mockResolvedValue(post as never);
    vi.mocked(Credential.findOne).mockResolvedValue({ platform_name: PLATFORMS.DEVTO } as never);
    publishToDevtoMock.mockResolvedValue({ updates: {}, action: "create" });
    vi.mocked(Post.findByIdAndUpdate).mockResolvedValue(null);
    const next = vi.fn();
    publishDevto({ body: { postId: "post-1" }, userId: "user-1" } as never, mockRes().res, next);
    await flushAsyncHandlers();
    expect(next).toHaveBeenCalledOnce();
  });

  it("unpublishPlatform throws when service returns null post", async () => {
    vi.mocked(Post.findById).mockResolvedValue({ _id: "p3", author: "u1" } as never);
    unpublishFromPlatformMock.mockResolvedValueOnce(null);
    const next = vi.fn();
    unpublishPlatform(
      { params: { postId: "p3", platform: PLATFORMS.MEDIUM }, userId: "u1" } as never,
      mockRes().res,
      next,
    );
    await flushAsyncHandlers();
    expect(next).toHaveBeenCalledOnce();
  });

  it("unpublishPlatform rejects LinkedIn via asyncHandler", async () => {
    vi.mocked(Post.findById).mockResolvedValue({ _id: "p3", author: "u1" } as never);
    const { res } = mockRes();
    const next = vi.fn();
    unpublishPlatform({ params: { postId: "p3", platform: PLATFORMS.LINKEDIN }, userId: "u1" } as never, res, next);
    await flushAsyncHandlers();
    expect(next).toHaveBeenCalledOnce();
    const err = next.mock.calls[0][0] as Error;
    expect(err.message).toBe(ERROR_MESSAGES.LINKEDIN_UNPUBLISH_UNSUPPORTED);
  });
});
