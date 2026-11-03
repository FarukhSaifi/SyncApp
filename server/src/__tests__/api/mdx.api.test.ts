import "../helpers/mockHeavyAiModules";

import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { registerUser } from "../helpers/authApi";
import { clearMemoryMongo, startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";
import { API_SUITE_HOOK_TIMEOUT_MS } from "../helpers/testInfra";

describe("mdx export API (memory Mongo)", () => {
  let app: typeof import("../../index").default;
  let token: string;
  let postId: string;

  beforeAll(async () => {
    await startMemoryMongo();
    app = (await import("../../index")).default;
  }, API_SUITE_HOOK_TIMEOUT_MS);

  afterAll(async () => {
    await stopMemoryMongo();
  });

  beforeEach(async () => {
    await clearMemoryMongo();
    const auth = await registerUser(app);
    token = auth.token;
    const created = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "MDX Export Sample Post",
        content_markdown: "# Hello\n\nBody",
        status: "draft",
        tags: ["syncapp", "test"],
      });
    postId = created.body.data._id as string;
  });

  it("returns markdown attachment for owner", async () => {
    const res = await request(app).get(`/api/mdx/${postId}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/markdown/);
    expect(res.headers["content-disposition"]).toMatch(/attachment/);
    expect(res.text).toContain("MDX Export Sample Post");
    expect(res.text).toContain("# Hello");
  });

  it("returns 403 when post belongs to another user", async () => {
    const other = await registerUser(app, { email: `other-${Date.now()}@example.com` });
    const res = await request(app).get(`/api/mdx/${postId}`).set("Authorization", `Bearer ${other.token}`);
    expect(res.status).toBe(403);
  });

  it("returns 404 for missing post", async () => {
    const res = await request(app).get("/api/mdx/507f1f77bcf86cd799439011").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
