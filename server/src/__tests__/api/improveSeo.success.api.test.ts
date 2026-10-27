import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { registerUser } from "../helpers/authApi";
import { clearMemoryMongo, startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";

vi.mock("@ai/improveSeo", () => ({
  improveSeoFromScorecard: vi.fn(async () => ({
    title: "Improved title for SEO testing",
    meta_description: "Improved meta description for tests.",
  })),
}));

describe("POST /api/ai/improve-seo success (mocked AI)", () => {
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

  it("returns improved fields when payload is valid", async () => {
    const res = await request(app)
      .post("/api/ai/improve-seo")
      .set("Authorization", `Bearer ${token}`)
      .send({
        targets: [
          {
            id: "title",
            field: "title",
            issue: "Title too short",
            currentValue: "Hi",
          },
        ],
        title: "Hi",
        content_markdown: "Body",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.title).toContain("Improved");
  });
});
