import { beforeEach, describe, expect, it, vi } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";

vi.mock("@services/aiService", () => ({
  getAiCapabilities: vi.fn(() => ({ provider: "studio", model: "gemini-test" })),
  getTrendingTopics: vi.fn(async () => [{ topic: "AI" }]),
  getDevtoReachTags: vi.fn(async () => ["javascript"]),
  generatePost: vi.fn(async () => ({ title: "Draft", content: "Body" })),
  generateKeywordResearch: vi.fn(async () => ({ keywords: [] })),
  generateImageFromTopic: vi.fn(async () => ({ url: "https://img.example/x.png" })),
  generateLinkedInSummary: vi.fn(async () => ({ summary: "LI" })),
  generateEdit: vi.fn(async () => ({ content: "edited" })),
  improveSeoFromScorecard: vi.fn(async () => ({ title: "Better" })),
}));

import * as aiController from "./aiController";

function mockRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const setHeader = vi.fn();
  return { status, json, setHeader };
}

describe("aiController handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCapabilities returns service payload", async () => {
    const res = mockRes();
    await aiController.getCapabilities({} as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("postGenerate validates optimization targets", async () => {
    const res = mockRes();
    const next = vi.fn();
    await aiController.postGenerate(
      { body: { keyword: "test keyword", targetPlatforms: ["not-valid"] } } as never,
      res as never,
      next,
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: HTTP_STATUS.BAD_REQUEST }));
  });

  it("postGenerate succeeds with valid body", async () => {
    const res = mockRes();
    const next = vi.fn();
    await aiController.postGenerate(
      { body: { keyword: "valid keyword phrase", targetPlatforms: ["devto"] } } as never,
      res as never,
      next,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
  });

  it("getTrendingTopics returns topics", async () => {
    const res = mockRes();
    aiController.getTrendingTopics({ query: { niche: "dev" } } as never, res as never, vi.fn());
    await vi.waitFor(() => expect(res.json).toHaveBeenCalled(), { timeout: 2000 });
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
  });

  it("getDevtoReachTags returns tag list", async () => {
    const res = mockRes();
    aiController.getDevtoReachTags({ query: {} } as never, res as never, vi.fn());
    await vi.waitFor(() => expect(res.json).toHaveBeenCalled(), { timeout: 2000 });
  });

  it("postKeywordResearch sets cache header", async () => {
    const res = mockRes();
    aiController.postKeywordResearch({ body: { seed: "react hooks guide" } } as never, res as never, vi.fn());
    await vi.waitFor(() => expect(res.setHeader).toHaveBeenCalled(), { timeout: 2000 });
  });

  it("postGenerateImage returns image payload", async () => {
    const res = mockRes();
    aiController.postGenerateImage(
      { body: { topic: "Blog cover topic for testing" } } as never,
      res as never,
      vi.fn(),
    );
    await vi.waitFor(() => expect(res.json).toHaveBeenCalled(), { timeout: 2000 });
  });

  it("postEdit returns edited text", async () => {
    const res = mockRes();
    aiController.postEdit({ body: { action: "shorten", text: "Long paragraph text." } } as never, res as never, vi.fn());
    await vi.waitFor(() => expect(res.json).toHaveBeenCalled(), { timeout: 2000 });
  });

  it("postImproveSeo returns improved fields", async () => {
    const res = mockRes();
    aiController.postImproveSeo(
      {
        body: {
          targets: ["title"],
          title: "Draft title",
          primaryKeyword: "syncapp",
          platforms: ["devto"],
        },
      } as never,
      res as never,
      vi.fn(),
    );
    await vi.waitFor(() => expect(res.json).toHaveBeenCalled(), { timeout: 2000 });
  });

  it("postGenerateLinkedInSummary returns summary", async () => {
    const res = mockRes();
    aiController.postGenerateLinkedInSummary(
      { body: { title: "Article title", content: "Article body with enough context for LinkedIn." } } as never,
      res as never,
      vi.fn(),
    );
    await vi.waitFor(() => expect(res.json).toHaveBeenCalled(), { timeout: 2000 });
  });
});
