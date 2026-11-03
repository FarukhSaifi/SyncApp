import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./googleSuggest", () => ({
  fetchGoogleSearchSuggestions: vi.fn(async () => ["syncapp keyword research"]),
}));

vi.mock("./client", () => ({
  buildModelCandidates: vi.fn(() => ["gemini-test"]),
  generateAiContent: vi.fn(async () => ({})),
  getModelName: vi.fn(() => "gemini-test"),
  getText: vi.fn(() =>
    JSON.stringify({
      keywords: [
        {
          keyword: "syncapp seo automation",
          commercialIntent: 72,
          intentLabel: "informational",
          competition: 40,
          monetizationAngle: "SaaS affiliate",
          rationale: "High intent workflow keyword",
        },
      ],
    }),
  ),
  hasAiConfigured: vi.fn(() => true),
  resolveAiProvider: vi.fn(() => "studio"),
}));

vi.mock("./retries", () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
}));

import { generateKeywordResearch } from "./generateKeywordResearch";

describe("generateKeywordResearch", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const client = await import("./client");
    vi.mocked(client.hasAiConfigured).mockReturnValue(true);
    vi.mocked(client.generateAiContent).mockResolvedValue({} as never);
    vi.mocked(client.getText).mockReturnValue(
      JSON.stringify({
        keywords: [
          {
            keyword: "syncapp seo automation",
            commercialIntent: 72,
            intentLabel: "informational",
            competition: 40,
            monetizationAngle: "SaaS affiliate",
            rationale: "High intent workflow keyword",
          },
        ],
      }),
    );
  });

  it("returns keyword rows for valid seed", async () => {
    const result = await generateKeywordResearch("syncapp content workflow");
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords[0].keyword).toContain("syncapp");
    expect(result.cached).toBe(false);
  });

  it("serves cached keywords on second call without refresh", async () => {
    await generateKeywordResearch("cache seed keyword topic");
    const cached = await generateKeywordResearch("cache seed keyword topic");
    expect(cached.cached).toBe(true);
  });

  it("rejects seeds that are too short", async () => {
    const { hasAiConfigured } = await import("./client");
    vi.mocked(hasAiConfigured).mockReturnValue(true);
    await expect(generateKeywordResearch("  ")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws when AI provider is not configured", async () => {
    const { hasAiConfigured } = await import("./client");
    vi.mocked(hasAiConfigured).mockReturnValue(false);
    await expect(generateKeywordResearch("valid seed phrase")).rejects.toMatchObject({ statusCode: 503 });
  });

  it("rejects seeds shorter than minimum length", async () => {
    await expect(generateKeywordResearch("a")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("bypasses cache when refresh is true", async () => {
    await generateKeywordResearch("refresh bypass seed phrase");
    const { generateAiContent } = await import("./client");
    const callsBefore = vi.mocked(generateAiContent).mock.calls.length;
    await generateKeywordResearch("refresh bypass seed phrase", { refresh: true });
    expect(vi.mocked(generateAiContent).mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("returns stale cache when refresh fails after a prior success", async () => {
    const seed = "stale cache recovery seed phrase";
    await generateKeywordResearch(seed);
    const { generateAiContent } = await import("./client");
    vi.mocked(generateAiContent).mockRejectedValue(new Error("upstream outage"));
    const stale = await generateKeywordResearch(seed, { refresh: true });
    expect(stale.cached).toBe(true);
    expect(stale.keywords.length).toBeGreaterThan(0);
  });

  it("maps rate-limit errors to 429 AppError", async () => {
    const { generateAiContent } = await import("./client");
    vi.mocked(generateAiContent).mockRejectedValue(new Error("429 RESOURCE_EXHAUSTED"));
    await expect(generateKeywordResearch("rate limit seed phrase", { refresh: true })).rejects.toMatchObject({
      statusCode: 429,
    });
  });

  it("rejects seeds longer than maximum length", async () => {
    const longSeed = "x".repeat(500);
    await expect(generateKeywordResearch(longSeed)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws service unavailable when AI returns invalid JSON and cache is empty", async () => {
    const { getText } = await import("./client");
    vi.mocked(getText).mockReturnValue("not-json");
    await expect(generateKeywordResearch("invalid json seed phrase", { refresh: true })).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it("maps credits depleted errors to 402", async () => {
    const { generateAiContent } = await import("./client");
    vi.mocked(generateAiContent).mockRejectedValue(new Error("prepayment credits are depleted"));
    await expect(generateKeywordResearch("credits depleted seed phrase", { refresh: true })).rejects.toMatchObject({
      statusCode: 402,
    });
  });

  it("falls back to second model candidate when first fails transiently", async () => {
    const client = await import("./client");
    vi.mocked(client.buildModelCandidates).mockReturnValue(["model-a", "model-b"]);
    vi.mocked(client.generateAiContent)
      .mockRejectedValueOnce(new Error("503 temporarily unavailable"))
      .mockResolvedValueOnce({} as never);

    const result = await generateKeywordResearch("model fallback seed phrase", { refresh: true });
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(vi.mocked(client.generateAiContent).mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
