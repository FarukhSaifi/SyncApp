import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { clearMemoryMongo, startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";

describe("POST /api/ai/improve-seo (memory Mongo)", () => {
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
    const reg = await request(app)
      .post("/api/auth/register")
      .send({
        username: "seo_user",
        email: `seo-${Date.now()}@example.com`,
        password: "password1",
      });
    token = reg.body.data.token as string;
  });

  it("rejects improve-seo when token is missing", async () => {
    const res = await request(app)
      .post("/api/ai/improve-seo")
      .send({
        targets: [{ id: "title", field: "title", issue: "Title too short", currentValue: "Hi" }],
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects improve-seo when targets are empty (Zod 400)", async () => {
    const res = await request(app)
      .post("/api/ai/improve-seo")
      .set("Authorization", `Bearer ${token}`)
      .send({ targets: [] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
