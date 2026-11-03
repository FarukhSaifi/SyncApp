import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { registerUser } from "../helpers/authApi";
import { clearMemoryMongo, startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";

vi.mock("@ai/generatePost", () => ({
  generatePost: vi.fn(async () => ({
    title: "API mocked draft title",
    content: "## Hello\n\nMocked content body.",
    meta_description: "Mocked meta",
    tags: ["test"],
    seoScorecard: { score: 42, maxScore: 100, checks: [], summary: "ok" },
  })),
}));

vi.mock("@ai/generateKeywordResearch", () => ({
  generateKeywordResearch: vi.fn(async () => ({ seed: "seed", keywords: [] })),
}));

vi.mock("@ai/generateTrendingTopics", () => ({
  getTrendingTopics: vi.fn(async () => [{ title: "Trend" }]),
}));

vi.mock("@ai/getDevtoTags", () => ({
  getDevtoReachTags: vi.fn(async () => ["javascript"]),
}));

describe("AI API routes (mocked Gemini)", () => {
  let app: typeof import("../../index").default;
  let token: string;

  beforeAll(async () => {
    await startMemoryMongo();
    app = (await import("../../index")).default;
  }, 120_000);

  afterAll(async () => {
    await stopMemoryMongo();
  });

  beforeEach(async () => {
    await clearMemoryMongo();
    const auth = await registerUser(app);
    token = auth.token;
  });

  it("GET /api/ai/capabilities requires auth then succeeds", async () => {
    const unauth = await request(app).get("/api/ai/capabilities");
    expect(unauth.status).toBe(401);

    const res = await request(app).get("/api/ai/capabilities").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.provider).toBeTruthy();
  });

  it("POST /api/ai/generate returns mocked draft", async () => {
    const res = await request(app)
      .post("/api/ai/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({ keyword: "mock keyword phrase", targetPlatforms: ["devto"] });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toContain("mocked");
  });

  it("GET /api/ai/trending-topics returns mocked list", async () => {
    const res = await request(app).get("/api/ai/trending-topics").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
