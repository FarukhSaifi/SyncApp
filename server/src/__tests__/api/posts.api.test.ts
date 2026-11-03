import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { registerUser } from "../helpers/authApi";
import { clearMemoryMongo, startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";

describe("posts API (memory Mongo)", () => {
  let app: typeof import("../../index").default;
  let token: string;
  let otherToken: string;

  beforeAll(async () => {
    await startMemoryMongo();
    app = (await import("../../index")).default;
  }, 120_000);

  afterAll(async () => {
    await stopMemoryMongo();
  });

  beforeEach(async () => {
    await clearMemoryMongo();
    const auth = await registerUser(app, { username: "post_user" });
    token = auth.token;
    const other = await registerUser(app, { username: "other_user" });
    otherToken = other.token;
  });

  it("creates draft when title and content are provided", async () => {
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Vitest draft post title",
        content_markdown: "## Hello\n\nBody for the draft.",
        status: "draft",
        tags: ["testing"],
      });
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.title).toBe("Vitest draft post title");
  });

  it("rejects create when token is missing", async () => {
    const res = await request(app).post("/api/posts").send({
      title: "No auth",
      content_markdown: "Body",
    });
    expect(res.status).toBe(401);
  });

  it("lists posts for authenticated user", async () => {
    await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Listed post title here", content_markdown: "x", status: "draft" });
    const res = await request(app).get("/api/posts").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("gets post by id and updates then deletes", async () => {
    const created = await request(app).post("/api/posts").set("Authorization", `Bearer ${token}`).send({
      title: "CRUD post title for tests",
      content_markdown: "Original",
      status: "draft",
    });
    const id = created.body.data._id as string;

    const got = await request(app).get(`/api/posts/${id}`).set("Authorization", `Bearer ${token}`);
    expect(got.status).toBe(200);
    expect(got.body.data.title).toBe("CRUD post title for tests");

    const updated = await request(app)
      .put(`/api/posts/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "CRUD post title updated now", content_markdown: "Updated body" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe("CRUD post title updated now");

    const deleted = await request(app).delete(`/api/posts/${id}`).set("Authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(200);

    const missing = await request(app).get(`/api/posts/${id}`).set("Authorization", `Bearer ${token}`);
    expect(missing.status).toBe(404);
  });

  it("forbids update when caller is not owner", async () => {
    const created = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Owner only post title", content_markdown: "x", status: "draft" });
    const id = created.body.data._id as string;
    const res = await request(app)
      .put(`/api/posts/${id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Hijack" });
    expect(res.status).toBe(403);
  });

  it("gets post by slug when slug exists", async () => {
    const created = await request(app).post("/api/posts").set("Authorization", `Bearer ${token}`).send({
      title: "Slug lookup post title",
      content_markdown: "Body",
      status: "draft",
    });
    const slug = created.body.data.slug as string;
    const res = await request(app).get(`/api/posts/slug/${slug}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe(slug);
  });
});
