import { beforeEach, describe, expect, it, vi } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";

vi.mock("@services/storage", () => ({
  generatePresignedUploadUrl: vi.fn(async () => ({
    presignedUrl: "https://signed/upload",
    publicUrl: "https://cdn.example/cover.png",
    key: "uploads/cover.png",
    headers: {},
  })),
}));

// Vitest requires mocked modules to be imported after `vi.mock`.
// eslint-disable-next-line import-x/order -- mock-then-import pattern
import { generatePresignedUploadUrl } from "@services/storage";

import { getPresignedUrl } from "./upload";

describe("upload controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns presigned upload payload", async () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const next = vi.fn();
    await getPresignedUrl(
      { body: { filename: "cover.png", contentType: "image/png", size: 2048 } } as never,
      { status, json } as never,
      next,
    );
    expect(status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ presignedUrl: expect.any(String) }) }),
    );
    expect(generatePresignedUploadUrl).toHaveBeenCalledWith("cover.png", "image/png", 2048);
  });

  it("forwards storage errors to next", async () => {
    vi.mocked(generatePresignedUploadUrl).mockRejectedValueOnce(new Error("bucket missing"));
    const next = vi.fn();
    await getPresignedUrl(
      { body: { filename: "cover.png", contentType: "image/png", size: 2048 } } as never,
      { status: vi.fn(), json: vi.fn() } as never,
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });
});
