import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./googleSuggest", () => ({
  fetchGoogleSearchSuggestions: vi.fn(async () => ["syncapp blog ideas"]),
}));

vi.mock("./client", () => ({
  buildModelCandidates: vi.fn(() => ["gemini-test"]),
  generateAiContent: vi.fn(async () => ({})),
  getModelName: vi.fn(() => "gemini-test"),
  getText: vi.fn(
    () =>
      JSON.stringify({
        topics: ["How to scale content ops with SyncApp"],
        keywords: ["content automation", "seo workflow"],
      }),
  ),
  hasAiConfigured: vi.fn(() => true),
  resolveAiProvider: vi.fn(() => "studio"),
}));

vi.mock("./retries", () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
}));

import { getTrendingTopics } from "./generateTrendingTopics";

describe("getTrendingTopics", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const client = await import("./client");
    vi.mocked(client.hasAiConfigured).mockReturnValue(true);
    vi.mocked(client.generateAiContent).mockResolvedValue({} as never);
    vi.mocked(client.getText).mockReturnValue(
      JSON.stringify({
        topics: ["How to scale content ops with SyncApp"],
        keywords: ["content automation", "seo workflow"],
      }),
    );
  });

  it("throws rate-limited AppError when provider returns 429 and cache is empty", async () => {
    const { generateAiContent } = await import("./client");
    vi.mocked(generateAiContent).mockRejectedValue(new Error("429 Resource exhausted"));
    await expect(getTrendingTopics({ refresh: true })).rejects.toMatchObject({ statusCode: 429 });
  });

  it("returns parsed topics and keywords", async () => {
    const result = await getTrendingTopics({ refresh: true });
    expect(result.topics.length).toBeGreaterThan(0);
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.cached).toBe(false);
  });

  it("returns cached payload without refresh", async () => {
    await getTrendingTopics({ refresh: true });
    const cached = await getTrendingTopics({});
    expect(cached.cached).toBe(true);
  });

  it("throws when AI is not configured", async () => {
    const { hasAiConfigured } = await import("./client");
    vi.mocked(hasAiConfigured).mockReturnValue(false);
    await expect(getTrendingTopics({ refresh: true })).rejects.toMatchObject({ statusCode: 503 });
  });

  it("returns stale cache when live fetch fails after prior success", async () => {
    vi.mocked((await import("./client")).generateAiContent).mockResolvedValue({} as never);
    vi.mocked((await import("./client")).getText).mockReturnValue(
      JSON.stringify({ topics: ["Cached topic after failure"], keywords: ["cached kw"] }),
    );
    await getTrendingTopics({ refresh: true });
    vi.mocked((await import("./client")).generateAiContent).mockRejectedValue(new Error("provider down"));
    const stale = await getTrendingTopics({ refresh: true });
    expect(stale.cached).toBe(true);
    expect(stale.topics.length).toBeGreaterThan(0);
  });
});
