import { beforeEach, describe, expect, it, vi } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

const buildModelCandidates = vi.hoisted(() => vi.fn(() => ["gemini-test"]));
const generateAiContent = vi.hoisted(() => vi.fn(async () => ({})));
const getText = vi.hoisted(() =>
  vi.fn(
    () =>
      `${"Insight about SyncApp publishing workflows. ".repeat(8)}Read more: https://blog.test/post\n\n#syncapp #seo #content`,
  ),
);

vi.mock("./client", () => ({
  buildModelCandidates,
  generateAiContent,
  getModelName: vi.fn(() => "gemini-test"),
  getText,
}));

vi.mock("./retries", () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
}));

import { generateLinkedInSummary } from "./generateLinkedInSummary";

describe("generateLinkedInSummary", () => {
  beforeEach(() => {
    generateAiContent.mockReset();
    generateAiContent.mockResolvedValue({});
    buildModelCandidates.mockReturnValue(["gemini-test"]);
    getText.mockReturnValue(
      `${"Insight about SyncApp publishing workflows. ".repeat(8)}Read more: https://blog.test/post\n\n#syncapp #seo #content`,
    );
  });

  it("rejects when context is too short", async () => {
    await expect(generateLinkedInSummary({ title: "Hi", content: "x" })).rejects.toMatchObject({
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  });

  it("returns finalized LinkedIn post text", async () => {
    const body = "# Title\n\n".repeat(20) + "Long article body about SyncApp publishing workflows.";
    const result = await generateLinkedInSummary({
      title: "SyncApp publishing guide",
      content: body,
      readMoreUrl: "https://blog.test/syncapp",
    });
    expect(result.linkedin_post.length).toBeGreaterThan(0);
    expect(result.linkedin_post.toLowerCase()).toContain("read more");
  });

  it("rejects disallowed model overrides", async () => {
    await expect(
      generateLinkedInSummary({
        title: "SyncApp publishing guide",
        content: "Long enough plain text body about SyncApp publishing workflows for LinkedIn summary generation.",
        model: "not-a-model",
      }),
    ).rejects.toMatchObject({ statusCode: HTTP_STATUS.BAD_REQUEST });
  });

  it("falls back to the next model on retry-worthy failures", async () => {
    buildModelCandidates.mockReturnValue(["gemini-a", "gemini-b"]);
    generateAiContent.mockRejectedValueOnce(new Error("503 unavailable")).mockResolvedValueOnce({});
    const body = "Long enough plain text body about SyncApp publishing workflows for LinkedIn summary generation.";
    const result = await generateLinkedInSummary({ title: "Guide", content: body });
    expect(result.linkedin_post.length).toBeGreaterThan(0);
    expect(generateAiContent).toHaveBeenCalledTimes(2);
  });

  it("maps non-retry provider failures immediately", async () => {
    generateAiContent.mockRejectedValueOnce(new Error("400 invalid argument"));
    const body = "Long enough plain text body about SyncApp publishing workflows for LinkedIn summary generation.";
    await expect(generateLinkedInSummary({ title: "Guide", content: body })).rejects.toThrow();
  });

  it("builds read-more URL when input URL is invalid", async () => {
    getText.mockReturnValue(`${"Insight about SyncApp publishing workflows. ".repeat(8)}#syncapp #seo #content`);
    const body = "Long enough plain text body about SyncApp publishing workflows for LinkedIn summary generation.";
    const result = await generateLinkedInSummary({
      title: "Guide",
      content: "<p>HTML body</p>".repeat(5) + body,
      readMoreUrl: "not-a-url",
    });
    expect(result.linkedin_post.length).toBeGreaterThan(0);
    expect(result).toHaveProperty("read_more_url");
  });

  it("fails when model output is too short after finalize", async () => {
    getText.mockReturnValue("too short");
    const body = "Long enough plain text body about SyncApp publishing workflows for LinkedIn summary generation.";
    await expect(generateLinkedInSummary({ title: "Guide", content: body })).rejects.toMatchObject({
      message: ERROR_MESSAGES.AI_LINKEDIN_SUMMARY_FAILED,
    });
  });
});
