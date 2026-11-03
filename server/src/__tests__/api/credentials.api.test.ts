import "../helpers/mockHeavyAiModules";

import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { clearMemoryMongo, startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";
import { API_SUITE_HOOK_TIMEOUT_MS } from "../helpers/testInfra";

describe("credentials API (memory Mongo)", () => {
  let app: typeof import("../../index").default;
  let token: string;

  beforeAll(async () => {
    await startMemoryMongo();
    app = (await import("../../index")).default;
  }, API_SUITE_HOOK_TIMEOUT_MS);

  afterAll(async () => {
    await stopMemoryMongo();
  });

  beforeEach(async () => {
    await clearMemoryMongo();
    const reg = await request(app)
      .post("/api/auth/register")
      .send({
        username: "cred_user",
        email: `cred-${Date.now()}@example.com`,
        password: "password1",
      });
    token = reg.body.data.token as string;
  });

  it("rejects upsert without auth", async () => {
    const res = await request(app).put("/api/credentials/devto").send({ api_key: "sk-test" });
    expect(res.status).toBe(401);
  });

  it("rejects upsert when Zod body is invalid", async () => {
    const res = await request(app).put("/api/credentials/devto").set("Authorization", `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("upserts credential metadata when payload is valid", async () => {
    const res = await request(app)
      .put("/api/credentials/devto")
      .set("Authorization", `Bearer ${token}`)
      .send({ api_key: "sk-test-key" });
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body.success).toBe(true);
  });

  it("lists and gets credential by platform then deletes", async () => {
    await request(app)
      .put("/api/credentials/devto")
      .set("Authorization", `Bearer ${token}`)
      .send({ api_key: "sk-list-key" });

    const list = await request(app).get("/api/credentials").set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((c: { platform_name: string }) => c.platform_name === "devto")).toBe(true);

    const one = await request(app).get("/api/credentials/devto").set("Authorization", `Bearer ${token}`);
    expect(one.status).toBe(200);
    expect(one.body.data.configured).toBe(true);
    expect(one.body.data.api_key_masked).toBeTruthy();

    const del = await request(app).delete("/api/credentials/devto").set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);

    const missing = await request(app).get("/api/credentials/devto").set("Authorization", `Bearer ${token}`);
    expect(missing.status).toBe(404);
  });
});
