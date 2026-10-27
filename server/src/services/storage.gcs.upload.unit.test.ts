import { EventEmitter } from "events";

import { beforeEach, describe, expect, it, vi } from "vitest";

const createWriteStream = vi.hoisted(() => vi.fn());
const makePublic = vi.hoisted(() => vi.fn(async () => undefined));
const getAccessToken = vi.hoisted(() => vi.fn(async () => ({ token: "" as string | null })));

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn(() => ({
    bucket: vi.fn(() => ({
      file: vi.fn(() => ({
        createWriteStream,
        makePublic,
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

describe("uploadToGCS writeStream fallback", () => {
  beforeEach(async () => {
    vi.resetModules();
    const { config: freshConfig } = await import("@config");
    freshConfig.gcpBucketName = "syncapp-uploads";
    createWriteStream.mockClear();
    makePublic.mockClear();
    getAccessToken.mockResolvedValue({ token: "" });
  });

  it("uploads via raw fetch when access token is available", async () => {
    getAccessToken.mockResolvedValue({ token: "gcs-token" });
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { uploadToGCS } = await loadStorageWithBucket("syncapp-9ab7f.firebasestorage.app");
    const url = await uploadToGCS(Buffer.from("png"), "cover.png", "image/png", true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(url).toMatch(/^https:\/\//);
    vi.unstubAllGlobals();
  });

  it("rejects writeStream failures with upload error", async () => {
    getAccessToken.mockResolvedValue({ token: "" });
    const stream = new EventEmitter() as EventEmitter & { end: ReturnType<typeof vi.fn> };
    stream.end = vi.fn(() => {
      process.nextTick(() => {
        stream.emit("error", new Error("stream broke"));
      });
      return stream;
    });
    createWriteStream.mockReturnValue(stream);

    const { uploadToGCS } = await loadStorageWithBucket("syncapp-uploads");
    await expect(uploadToGCS(Buffer.from("png"), "cover.png", "image/png", true)).rejects.toThrow();
  });

  it("falls back to writeStream when raw fetch upload returns non-ok status", async () => {
    getAccessToken.mockResolvedValue({ token: "gcs-token" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503 })),
    );
    const stream = new EventEmitter() as EventEmitter & { end: ReturnType<typeof vi.fn> };
    stream.end = vi.fn((_buffer: Buffer) => {
      process.nextTick(() => {
        stream.emit("finish");
      });
      return stream;
    });
    createWriteStream.mockReturnValue(stream);

    const { uploadToGCS } = await loadStorageWithBucket("plain-gcs-bucket");
    const url = await uploadToGCS(Buffer.from("png"), "cover.png", "image/png", true);
    expect(url).toContain("storage.googleapis.com/plain-gcs-bucket");
    vi.unstubAllGlobals();
  });

  it("falls back to writeStream when token lookup throws", async () => {
    getAccessToken.mockRejectedValueOnce(new Error("auth down"));
    const stream = new EventEmitter() as EventEmitter & { end: ReturnType<typeof vi.fn> };
    stream.end = vi.fn(() => {
      process.nextTick(() => {
        stream.emit("finish");
      });
      return stream;
    });
    createWriteStream.mockReturnValue(stream);

    const { uploadToGCS } = await loadStorageWithBucket("syncapp-uploads");
    const url = await uploadToGCS(Buffer.from("png"), "cover.png", "image/png", true);
    expect(url).toContain("syncapp-uploads");
    expect(createWriteStream).toHaveBeenCalledOnce();
  });

  it("uploads via createWriteStream when raw fetch upload has no token", async () => {
    const stream = new EventEmitter() as EventEmitter & { end: ReturnType<typeof vi.fn> };
    stream.end = vi.fn((_buffer: Buffer) => {
      process.nextTick(() => {
        stream.emit("finish");
      });
      return stream;
    });
    createWriteStream.mockReturnValue(stream);

    const { uploadToGCS } = await loadStorageWithBucket("syncapp-uploads");
    const url = await uploadToGCS(Buffer.from("png"), "cover.png", "image/png", true);
    expect(url).toMatch(/cover.*\.png$/);
    expect(createWriteStream).toHaveBeenCalledOnce();
    expect(makePublic).toHaveBeenCalledOnce();
  });

  it("still returns public URL when makePublic fails on stream upload", async () => {
    makePublic.mockRejectedValueOnce(new Error("uniform bucket access"));
    const stream = new EventEmitter() as EventEmitter & { end: ReturnType<typeof vi.fn> };
    stream.end = vi.fn(() => {
      process.nextTick(() => {
        stream.emit("finish");
      });
      return stream;
    });
    createWriteStream.mockReturnValue(stream);

    const { uploadToGCS } = await loadStorageWithBucket("syncapp-uploads");
    const url = await uploadToGCS(Buffer.from("png"), "cover.png", "image/png", true);
    expect(url).toContain("syncapp-uploads");
  });
});
