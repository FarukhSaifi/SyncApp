import { config } from "@config";
import { AppError } from "@middleware/errorHandler";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

const getSignedUrl = vi.hoisted(() => vi.fn(async () => ["https://signed.upload/url"]));

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn(() => ({
    bucket: vi.fn(() => ({
      file: vi.fn(() => ({
        getSignedUrl,
      })),
    })),
    authClient: {
      getCredentials: vi.fn(async () => ({ client_email: "sa@test.iam.gserviceaccount.com" })),
    },
  })),
}));

vi.mock("@utils/googleCredentials", () => ({
  loadGoogleServiceAccountCredentials: vi.fn(() => ({
    client_email: "sa@test.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
    project_id: "proj",
  })),
  resolveGcsSigningServiceAccountEmail: vi.fn(() => "sa@test.iam.gserviceaccount.com"),
}));

import { generatePresignedUploadUrl } from "./storage";

describe("storage GCS presign (mocked)", () => {
  beforeEach(() => {
    config.gcpBucketName = "syncapp-uploads";
    getSignedUrl.mockClear();
  });

  it("returns signed upload URL when bucket configured", async () => {
    const result = await generatePresignedUploadUrl("cover.png", "image/png", 2048);
    expect(result.presignedUrl).toContain("https://signed.upload/url");
    expect(result.publicUrl).toMatch(/cover.*\.png$/);
    expect(getSignedUrl).toHaveBeenCalledOnce();
  });

  it("rethrows AppError from presign path unchanged", async () => {
    const appErr = new AppError(ERROR_MESSAGES.UPLOAD_IMAGE_TYPE_INVALID, HTTP_STATUS.BAD_REQUEST);
    getSignedUrl.mockRejectedValueOnce(appErr);
    await expect(generatePresignedUploadUrl("cover.png", "image/png", 2048)).rejects.toBe(appErr);
  });

  it("maps unexpected presign failures to GCS_SIGNED_URL_FAILED", async () => {
    getSignedUrl.mockRejectedValueOnce(new Error("signing broke"));
    await expect(generatePresignedUploadUrl("cover.png", "image/png", 2048)).rejects.toMatchObject({
      message: ERROR_MESSAGES.GCS_SIGNED_URL_FAILED,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  });
});
