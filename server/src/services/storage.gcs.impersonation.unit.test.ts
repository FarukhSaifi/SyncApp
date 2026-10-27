import { config } from "@config";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_MESSAGES } from "@constants/messages";

const StorageCtor = vi.hoisted(() =>
  vi.fn(function StorageMock(this: { authClient: { getCredentials: ReturnType<typeof vi.fn> } }) {
    this.authClient = {
      getCredentials: vi.fn(async () => ({})),
    };
  }),
);

vi.mock("@google-cloud/storage", () => ({
  Storage: StorageCtor,
}));

vi.mock("google-auth-library", () => ({
  GoogleAuth: vi.fn(function GoogleAuthMock() {
    return {
      getClient: vi.fn(async () => ({})),
      authClient: {},
    };
  }),
  Impersonated: vi.fn(function ImpersonatedMock() {
    return {};
  }),
}));

vi.mock("@utils/googleCredentials", () => ({
  loadGoogleServiceAccountCredentials: vi.fn(() => null),
  resolveGcsSigningServiceAccountEmail: vi.fn(() => "signer@test.iam.gserviceaccount.com"),
}));

describe("storage impersonation client", () => {
  beforeEach(async () => {
    vi.resetModules();
    config.gcpBucketName = "syncapp-uploads";
    config.googleCloudProject = "proj";
    StorageCtor.mockClear();
  });

  it("uses impersonated Storage when ADC probe lacks client_email", async () => {
    const { generatePresignedUploadUrl } = await import("./storage");
    await expect(generatePresignedUploadUrl("cover.png", "image/png", 1024)).rejects.toThrow(
      ERROR_MESSAGES.GCS_SIGNED_URL_FAILED,
    );
    expect(StorageCtor).toHaveBeenCalled();
  });
});
