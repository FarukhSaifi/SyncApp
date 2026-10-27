import { AppError } from "@middleware/errorHandler";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";

vi.mock("./client", () => ({
  buildModelCandidates: vi.fn(() => ["gemini-test"]),
  generateAiContent: vi.fn(async () => ({ candidates: [] })),
  getModelName: vi.fn(() => "gemini-test"),
  getText: vi.fn(() =>
    JSON.stringify({
      title: "Generated post title for unit test",
      content_markdown: "## Intro\n\nGenerated body with enough text for SEO scoring in tests.",
      meta_description: "Generated meta description for the post.",
      tags: ["testing"],
    }),
  ),
}));

vi.mock("./retries", () => ({
  withRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}));

import { generatePost } from "./generatePost";

describe("generatePost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty keyword", async () => {
    await expect(generatePost("   ")).rejects.toMatchObject({
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  });

  it("returns parsed draft with seo scorecard", async () => {
    const result = await generatePost("vitest keyword topic", { targetPlatforms: ["devto"] });
    expect(result.title).toContain("Generated post");
    expect(result.content).toContain("Intro");
    expect(result.seoScorecard?.score).toBeGreaterThanOrEqual(0);
  });

  it("attaches seo warnings for low google scores", async () => {
    const result = await generatePost("vitest keyword topic", { targetPlatforms: ["google"] });
    expect(result.seoScorecard).toBeDefined();
    expect(Array.isArray(result.seo_warnings)).toBe(true);
  });

  it("uses research context when monetization intent is valid", async () => {
    const result = await generatePost("vitest keyword topic", {
      targetPlatforms: ["devto"],
      researchContext: {
        monetizationAngle: "Affiliate roundup for developer tools",
        intentLabel: "commercial",
      },
    });
    expect(result.title!.length).toBeGreaterThan(0);
  });

  it("surfaces non-fallback errors via AppError", async () => {
    const client = await import("./client");
    vi.mocked(client.generateAiContent).mockRejectedValueOnce(new AppError("blocked", HTTP_STATUS.FORBIDDEN));
    await expect(generatePost("keyword")).rejects.toBeInstanceOf(AppError);
  });
});
