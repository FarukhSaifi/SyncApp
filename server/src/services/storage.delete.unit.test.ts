import { buildFirebaseStoragePublicUrl, buildGcsPublicObjectUrl, DEFAULT_VALUES } from "@constants";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteObject = vi.hoisted(() => vi.fn(async () => undefined));
const fileMock = vi.hoisted(() =>
  vi.fn(() => ({
    delete: deleteObject,
  })),
);
const bucketMock = vi.hoisted(() =>
  vi.fn(() => ({
    file: fileMock,
  })),
);

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn().mockImplementation(function StorageMock(this: {
    bucket: typeof bucketMock;
    authClient: { getCredentials: ReturnType<typeof vi.fn> };
  }) {
    this.bucket = bucketMock;
    this.authClient = {
      getCredentials: vi.fn(async () => ({ client_email: "sa@test.iam.gserviceaccount.com" })),
    };
  }),
}));

vi.mock("@utils/googleCredentials", () => ({
  loadGoogleServiceAccountCredentials: vi.fn(() => ({
    client_email: "sa@test.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
    project_id: "proj",
  })),
  resolveGcsSigningServiceAccountEmail: vi.fn(() => "sa@test.iam.gserviceaccount.com"),
}));

async function loadStorageWithBucket(bucketName: string) {
  vi.resetModules();
  process.env.GCS_BUCKET_NAME = bucketName;
  const { config: freshConfig } = await import("@config");
  freshConfig.gcpBucketName = bucketName;
  return import("./storage");
}

describe("deleteFromGCS", () => {
  const bucketName = "syncapp-9ab7f.firebasestorage.app";

  beforeEach(async () => {
    vi.resetModules();
    deleteObject.mockClear();
    fileMock.mockClear();
    bucketMock.mockClear();
    deleteObject.mockResolvedValue(undefined);
  });

  it("parses GCS and Firebase public URLs", async () => {
    const { parseGcsObjectFromPublicUrl } = await loadStorageWithBucket(bucketName);
    const objectPath = `${DEFAULT_VALUES["GCS_UPLOAD_PREFIX"]}cover-old.webp`;

    expect(parseGcsObjectFromPublicUrl(buildGcsPublicObjectUrl(bucketName, objectPath))).toEqual({
      bucketName,
      objectPath,
    });
    expect(parseGcsObjectFromPublicUrl(buildFirebaseStoragePublicUrl(bucketName, objectPath))).toEqual({
      bucketName,
      objectPath,
    });
    expect(parseGcsObjectFromPublicUrl("data:image/png;base64,abc")).toBeNull();
    expect(parseGcsObjectFromPublicUrl("https://cdn.example.com/cover.png")).toBeNull();
  });

  it("deletes objects that belong to the configured bucket under uploads/", async () => {
    const { deleteFromGCS } = await loadStorageWithBucket(bucketName);
    const objectPath = `${DEFAULT_VALUES["GCS_UPLOAD_PREFIX"]}cover-old.webp`;
    const publicUrl = buildFirebaseStoragePublicUrl(bucketName, objectPath);

    await deleteFromGCS(publicUrl);

    expect(bucketMock).toHaveBeenCalledWith(bucketName);
    expect(fileMock).toHaveBeenCalledWith(objectPath);
    expect(deleteObject).toHaveBeenCalledWith({ ignoreNotFound: true });
  });

  it("skips delete for foreign buckets, missing URLs, and non-upload paths", async () => {
    const { deleteFromGCS } = await loadStorageWithBucket(bucketName);

    await deleteFromGCS("");
    await deleteFromGCS("https://cdn.example.com/external.png");
    await deleteFromGCS(buildGcsPublicObjectUrl("other-bucket", `${DEFAULT_VALUES["GCS_UPLOAD_PREFIX"]}x.png`));
    await deleteFromGCS(buildGcsPublicObjectUrl(bucketName, "not-uploads/secret.png"));

    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("logs and swallows delete failures", async () => {
    deleteObject.mockRejectedValueOnce(new Error("permission denied"));
    const { deleteFromGCS } = await loadStorageWithBucket(bucketName);
    const publicUrl = buildGcsPublicObjectUrl(bucketName, `${DEFAULT_VALUES["GCS_UPLOAD_PREFIX"]}cover-old.webp`);

    await expect(deleteFromGCS(publicUrl)).resolves.toBeUndefined();
  });
});
