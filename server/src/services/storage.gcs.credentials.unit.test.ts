import { config } from "@config";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSignedUrl = vi.hoisted(() => vi.fn(async () => ["https://signed.upload/url"]));
const getAccessToken = vi.hoisted(() => vi.fn(async () => ({ token: "adc-token" })));

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn(() => ({
    bucket: vi.fn(() => ({
      file: vi.fn(() => ({
        getSignedUrl,
      })),
    })),
    authClient: {
      getClient: vi.fn(async () => ({ getAccessToken })),
      getCredentials: vi.fn(async () => ({ client_email: "sa@test.iam.gserviceaccount.com" })),
    },
  })),
}));

vi.mock("@utils/googleCredentials", () => ({
  loadGoogleServiceAccountCredentials: vi.fn(() => ({
    client_email: "sa@test.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
    project_id: "proj-from-sa",
  })),
  resolveGcsSigningServiceAccountEmail: vi.fn(() => "sa@test.iam.gserviceaccount.com"),
}));

describe("storage GCS service account client", () => {
  beforeEach(() => {
    vi.resetModules();
    config.gcpBucketName = "syncapp-uploads";
    config.googleCloudProject = "";
    getSignedUrl.mockClear();
  });

  it("generates presigned url using service account credentials", async () => {
    const { generatePresignedUploadUrl } = await import("./storage");
    const result = await generatePresignedUploadUrl("cover.jpg", "image/jpeg", 4096);
    expect(result.presignedUrl).toContain("https://signed.upload/url");
    expect(result.headers["Content-Type"]).toBe("image/jpeg");
  });

  it("uploads via fetch when token is returned from service account client", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { uploadToGCS } = await import("./storage");
    const url = await uploadToGCS(Buffer.from("jpg"), "photo.jpg", "image/jpeg", true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(url).toMatch(/^https:\/\//);
    vi.unstubAllGlobals();
  });
});
