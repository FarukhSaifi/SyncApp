import { AI_CONFIG, AI_IMAGE_SOURCES } from "@constants";
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

const sharpMocks = vi.hoisted(() => {
  const toBuffer = vi.fn(async () => Buffer.from("converted-png-bytes"));
  const png = vi.fn(() => ({ toBuffer }));
  const sharp = vi.fn(() => ({ png }));
  return { sharp, png, toBuffer };
});

vi.mock("sharp", () => ({
  default: sharpMocks.sharp,
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
    sharpMocks.toBuffer.mockResolvedValue(Buffer.from("converted-png-bytes"));
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

  it("returns PNG data URL without uploading to GCS", async () => {
    const result = await generateImageFromTopic("SyncApp blog topic");
    expect(result.source).toBe(AI_IMAGE_SOURCES.GEMINI);
    expect(result.imageDataUrl).toBe(
      `data:${AI_CONFIG.IMAGE_MIME_PNG};base64,${Buffer.from("converted-png-bytes").toString("base64")}`,
    );
    expect(result.imageUrl).toBeUndefined();
    expect(uploadToGCS).not.toHaveBeenCalled();
    expect(sharpMocks.sharp).toHaveBeenCalled();
    expect(sharpMocks.png).toHaveBeenCalledWith({ compressionLevel: AI_CONFIG.IMAGE_PNG_COMPRESSION_LEVEL });
  });

  it("accepts optional user instruction for prompt generation", async () => {
    const result = await generateImageFromTopic("SyncApp blog topic", "minimal flat illustration");
    expect(result.imageDataUrl.startsWith(`data:${AI_CONFIG.IMAGE_MIME_PNG};base64,`)).toBe(true);
    expect(result.imageUrl).toBeUndefined();
    expect(uploadToGCS).not.toHaveBeenCalled();
    expect(generateContent).toHaveBeenCalled();
    expect(vi.mocked(generateAiContent)).not.toHaveBeenCalled();
  });

  it("converts Gemini WebP inline_data to standardized PNG data URL", async () => {
    generateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [{ inline_data: { data: Buffer.from("gemini-webp").toString("base64"), mime_type: "image/webp" } }],
          },
        },
      ],
    });
    const result = await generateImageFromTopic("Snake case inline topic");
    expect(result.imageDataUrl.startsWith(`data:${AI_CONFIG.IMAGE_MIME_PNG};base64,`)).toBe(true);
    expect(result.imageDataUrl).not.toContain("data:image/webp");
    expect(uploadToGCS).not.toHaveBeenCalled();
  });

  it("converts Gemini JPEG mime to PNG data URL", async () => {
    generateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [{ inlineData: { data: Buffer.from("jpeg-bytes").toString("base64"), mimeType: "image/jpeg" } }],
          },
        },
      ],
    });
    const result = await generateImageFromTopic("Jpeg cover topic");
    expect(result.imageDataUrl.startsWith(`data:${AI_CONFIG.IMAGE_MIME_PNG};base64,`)).toBe(true);
    expect(sharpMocks.sharp).toHaveBeenCalled();
  });

  it("throws service unavailable when conversion fails for all candidates", async () => {
    sharpMocks.toBuffer.mockRejectedValue(new Error("invalid image"));
    await expect(generateImageFromTopic("Bad bytes topic")).rejects.toMatchObject({
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    });
    expect(uploadToGCS).not.toHaveBeenCalled();
  });

  it("throws service unavailable when no model returns image bytes", async () => {
    generateContent.mockResolvedValue({ candidates: [{ content: { parts: [{ text: "no image" }] } }] });
    vi.mocked(getAiClient).mockReturnValue({ models: { generateContent } } as never);
    await expect(generateImageFromTopic("No image bytes topic")).rejects.toMatchObject({
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    });
    expect(uploadToGCS).not.toHaveBeenCalled();
    expect(sharpMocks.sharp).not.toHaveBeenCalled();
  });
});
