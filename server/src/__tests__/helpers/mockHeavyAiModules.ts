/**
 * Hoisted AI mocks so API suites can `import("../../index")` without Vitest
 * worker fetch/transform timeouts on heavy `@ai/*` modules.
 */
import { vi } from "vitest";

vi.mock("@ai/generateKeywordResearch", () => ({
  generateKeywordResearch: vi.fn(async () => ({ seed: "seed", keywords: [] })),
}));

vi.mock("@ai/generatePost", () => ({
  generatePost: vi.fn(async () => ({
    title: "Mocked draft title",
    content: "## Hello\n\nMocked body.",
    meta_description: "Mocked meta",
    tags: ["test"],
    seoScorecard: { score: 42, maxScore: 100, checks: [], summary: "ok" },
  })),
}));

vi.mock("@ai/generateTrendingTopics", () => ({
  getTrendingTopics: vi.fn(async () => [{ title: "Trend" }]),
}));

vi.mock("@ai/getDevtoTags", () => ({
  getDevtoReachTags: vi.fn(async () => ["javascript"]),
}));

vi.mock("@ai/improveSeo", () => ({
  improveSeo: vi.fn(async () => ({
    title: "Improved title",
    content: "Improved content",
    meta_description: "Improved meta",
    tags: ["seo"],
  })),
}));
