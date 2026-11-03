import { config } from "@config";
import { beforeEach, describe, expect, it } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

import { generatePresignedUploadUrl, uploadToGCS } from "./storage";

describe("storage upload fallbacks", () => {
  beforeEach(() => {
    config.gcpBucketName = "";
  });

  it("uploadToGCS saves locally when bucket is unset", async () => {
    const url = await uploadToGCS(Buffer.from("abc"), "cover-test.png", "image/png", false);
    expect(url).toContain("/uploads/");
    expect(url).toContain("cover-test");
  });

  it("uploadToGCS throws when forceGCS without bucket", async () => {
    await expect(uploadToGCS(Buffer.from("abc"), "x.png", "image/png", true)).rejects.toMatchObject({
      message: ERROR_MESSAGES.GCS_BUCKET_NOT_CONFIGURED,
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    });
  });

  it("generatePresignedUploadUrl rejects invalid mime type", async () => {
    config.gcpBucketName = "syncapp-uploads";
    await expect(generatePresignedUploadUrl("a.exe", "application/octet-stream", 100)).rejects.toMatchObject({
      message: ERROR_MESSAGES.UPLOAD_IMAGE_TYPE_INVALID,
    });
  });

  it("generatePresignedUploadUrl rejects oversized payload", async () => {
    config.gcpBucketName = "syncapp-uploads";
    await expect(generatePresignedUploadUrl("a.png", "image/png", 50_000_000)).rejects.toMatchObject({
      message: ERROR_MESSAGES.UPLOAD_IMAGE_TOO_LARGE,
    });
  });

  it("generatePresignedUploadUrl rejects when bucket missing", async () => {
    await expect(generatePresignedUploadUrl("a.png", "image/png", 100)).rejects.toMatchObject({
      message: ERROR_MESSAGES.GCS_BUCKET_NOT_CONFIGURED,
    });
  });
});
