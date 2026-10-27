import { AI_IMAGE_SOURCES } from "@constants";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";

const generateContent = vi.fn();

vi.mock("./client", () => ({
  buildModelCandidates: vi.fn(() => ["gemini-image-test"]),
  generateAiContent: vi.fn(async () => ({ text: "image prompt for blog cover" })),
  getAiClient: vi.fn(() => ({ models: { generateContent } })),
  getModelName: vi.fn(() => "gemini-image-test"),
  getText: vi.fn(() => "image prompt for blog cover"),
  resolveAiProvider: vi.fn(() => "studio"),
}));

vi.mock("./retries", () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
}));

const uploadToGCS = vi.hoisted(() => vi.fn(async () => "https://cdn.example/cover.png"));

vi.mock("@services/storage", () => ({
  uploadToGCS,
}));

import { generateAiContent, getAiClient } from "./client";
import { generateImageFromTopic } from "./generateImage";

describe("generateImageFromTopic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ inlineData: { data: Buffer.from("png-bytes").toString("base64"), mimeType: "image/png" } }],
          },
        },
      ],
    });
  });

  it("rejects empty topic", async () => {
    await expect(generateImageFromTopic("  ")).rejects.toMatchObject({ statusCode: HTTP_STATUS.BAD_REQUEST });
  });

  it("returns data URL and optional persisted URL", async () => {
    const result = await generateImageFromTopic("SyncApp blog topic");
    expect(result.source).toBe(AI_IMAGE_SOURCES.GEMINI);
    expect(result.imageDataUrl).toContain("data:image/png;base64,");
    expect(result.imageUrl).toContain("cdn.example");
  });

  it("accepts optional user instruction for prompt generation", async () => {
    const result = await generateImageFromTopic("SyncApp blog topic", "minimal flat illustration");
    expect(result.imageDataUrl).toContain("data:image/png;base64,");
    expect(generateContent).toHaveBeenCalled();
    expect(vi.mocked(generateAiContent)).not.toHaveBeenCalled();
  });

  it("returns data URL when storage upload fails", async () => {
    uploadToGCS.mockRejectedValueOnce(new Error("gcs down"));
    const result = await generateImageFromTopic("Storage skip topic");
    expect(result.imageDataUrl).toContain("data:image/png;base64,");
    expect(result.imageUrl).toBeUndefined();
  });

  it("reads inline_data snake_case parts from the model response", async () => {
    generateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [{ inline_data: { data: Buffer.from("webp").toString("base64"), mime_type: "image/webp" } }],
          },
        },
      ],
    });
    const result = await generateImageFromTopic("Snake case inline topic");
    expect(result.imageDataUrl).toContain("data:image/webp;base64,");
  });

  it("throws service unavailable when no model returns image bytes", async () => {
    generateContent.mockResolvedValue({ candidates: [{ content: { parts: [{ text: "no image" }] } }] });
    vi.mocked(getAiClient).mockReturnValue({ models: { generateContent } } as never);
    await expect(generateImageFromTopic("No image bytes topic")).rejects.toMatchObject({
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    });
  });
});
