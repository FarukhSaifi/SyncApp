
import { SEO_IMPROVE_APPLY, SEO_IMPROVE_FIELDS } from "@constants";
import { AppError } from "@middleware/errorHandler";
import { beforeEach, describe, expect, it, vi } from "vitest";

const buildModelCandidates = vi.hoisted(() => vi.fn(() => ["gemini-test"]));

vi.mock("./client", () => ({
  buildModelCandidates,
  generateAiContent: vi.fn(),
  getModelName: vi.fn(() => "gemini-test"),
  getText: vi.fn(),
}));

vi.mock("./retries", () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
}));

import { getText, generateAiContent } from "./client";
import { improveSeoFromScorecard } from "./improveSeo";

describe("improveSeoFromScorecard (mocked Gemini)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildModelCandidates.mockReturnValue(["gemini-test"]);
  });

  it("returns aligned fixes from model JSON", async () => {
    vi.mocked(generateAiContent).mockResolvedValue({} as never);
    vi.mocked(getText).mockReturnValue(
      JSON.stringify({
        fixes: [{ id: "title-fix", value: "Better SEO title for SyncApp" }],
      }),
    );

    const result = await improveSeoFromScorecard({
      targets: [
        {
          id: "title-fix",
          field: SEO_IMPROVE_FIELDS.TITLE,
          issue: "Title too short",
          currentValue: "Short",
          applyMode: SEO_IMPROVE_APPLY.REPLACE,
        },
      ],
      primaryKeyword: "syncapp",
      title: "Short",
    });

    expect(result.fixes).toHaveLength(1);
    expect(result.fixes[0].value).toContain("Better SEO title");
    expect(generateAiContent).toHaveBeenCalledOnce();
  });

  it("rejects empty targets before calling the model", async () => {
    await expect(improveSeoFromScorecard({ targets: [] })).rejects.toBeInstanceOf(AppError);
    expect(generateAiContent).not.toHaveBeenCalled();
  });

  it("rejects invalid target payloads after sanitization", async () => {
    await expect(
      improveSeoFromScorecard({
        targets: [{ id: "x", field: "not-a-field", issue: "Bad", currentValue: "", applyMode: "replace" }],
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("maps rate limit failures to 429 AppError", async () => {
    vi.mocked(generateAiContent).mockRejectedValue(new Error("429 RESOURCE_EXHAUSTED"));
    await expect(
      improveSeoFromScorecard({
        targets: [
          {
            id: "title-fix",
            field: SEO_IMPROVE_FIELDS.TITLE,
            issue: "Title too short",
            currentValue: "Short",
            applyMode: SEO_IMPROVE_APPLY.REPLACE,
          },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 429 });
  });

  it("maps credit depletion failures to 402 AppError", async () => {
    vi.mocked(generateAiContent).mockRejectedValue(new Error("prepayment credits are depleted"));
    await expect(
      improveSeoFromScorecard({
        targets: [
          {
            id: "title-fix",
            field: SEO_IMPROVE_FIELDS.TITLE,
            issue: "Title too short",
            currentValue: "Short",
            applyMode: SEO_IMPROVE_APPLY.REPLACE,
          },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 402 });
  });

  it("parses fixes from fenced JSON and preserves surroundingContext", async () => {
    vi.mocked(generateAiContent).mockResolvedValue({} as never);
    vi.mocked(getText).mockReturnValue(
      "```json\n" +
        JSON.stringify({
          fixes: [{ id: "meta-fix", value: "Updated meta description for SyncApp SEO improve path.", note: " clearer " }],
        }) +
        "\n```",
    );

    const result = await improveSeoFromScorecard({
      targets: [
        {
          id: "meta-fix",
          field: SEO_IMPROVE_FIELDS.META_DESCRIPTION,
          issue: "Meta too short",
          currentValue: "Short meta",
          applyMode: SEO_IMPROVE_APPLY.REPLACE,
          surroundingContext: "Intro paragraph context",
        },
      ],
      platforms: [" Devto ", "GOOGLE"],
    });

    expect(result.fixes[0]?.note).toBe("clearer");
    expect(generateAiContent).toHaveBeenCalledOnce();
  });

  it("falls back to the next model when the first call is retry-worthy", async () => {
    buildModelCandidates.mockReturnValue(["gemini-a", "gemini-b"]);
    vi.mocked(generateAiContent)
      .mockRejectedValueOnce(new Error("503 unavailable"))
      .mockResolvedValueOnce({} as never);
    vi.mocked(getText).mockReturnValue(JSON.stringify({ fixes: [{ id: "title-fix", value: "Better SEO title for SyncApp" }] }));

    const result = await improveSeoFromScorecard({
      targets: [
        {
          id: "title-fix",
          field: SEO_IMPROVE_FIELDS.TITLE,
          issue: "Title too short",
          currentValue: "Short",
          applyMode: SEO_IMPROVE_APPLY.REPLACE,
        },
      ],
    });

    expect(result.fixes).toHaveLength(1);
    expect(generateAiContent).toHaveBeenCalledTimes(2);
  });

  it("throws when parsed fixes do not align to requested targets", async () => {
    vi.mocked(generateAiContent).mockResolvedValue({} as never);
    vi.mocked(getText).mockReturnValue(JSON.stringify({ fixes: [{ id: "other-id", value: "Unused fix value" }] }));

    await expect(
      improveSeoFromScorecard({
        targets: [
          {
            id: "title-fix",
            field: SEO_IMPROVE_FIELDS.TITLE,
            issue: "Title too short",
            currentValue: "Short",
            applyMode: SEO_IMPROVE_APPLY.REPLACE,
          },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 502 });
  });

  it("throws when model JSON cannot be parsed into fixes", async () => {
    vi.mocked(generateAiContent).mockResolvedValue({} as never);
    vi.mocked(getText).mockReturnValue("not json");

    await expect(
      improveSeoFromScorecard({
        targets: [
          {
            id: "title-fix",
            field: SEO_IMPROVE_FIELDS.TITLE,
            issue: "Title too short",
            currentValue: "Short",
            applyMode: SEO_IMPROVE_APPLY.REPLACE,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
