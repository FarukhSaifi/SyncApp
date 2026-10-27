import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { registerUser } from "../helpers/authApi";
import { clearMemoryMongo, startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";

vi.mock("@services/storage", () => ({
  uploadToGCS: vi.fn(async () => "https://storage.example.com/cover.png"),
}));

describe("posts cover upload API (memory Mongo)", () => {
  let app: typeof import("../../index").default;
  let token: string;
  let postId: string;

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
    const created = await request(app).post("/api/posts").set("Authorization", `Bearer ${token}`).send({
      title: "Cover upload test post title",
      content_markdown: "Body",
      status: "draft",
    });
    postId = created.body.data._id as string;
  });

  it("uploads cover from data URL when owner matches", async () => {
    const tinyPng =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const res = await request(app)
      .put(`/api/posts/${postId}/cover`)
      .set("Authorization", `Bearer ${token}`)
      .send({ image: tinyPng });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toContain("storage.example.com");
  });

  it("rejects cover upload without image body", async () => {
    const res = await request(app).put(`/api/posts/${postId}/cover`).set("Authorization", `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
  });
});
