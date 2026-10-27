import "../helpers/mockHeavyAiModules";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";
import { API_SUITE_HOOK_TIMEOUT_MS } from "../helpers/testInfra";

describe("cron API (memory Mongo)", () => {
  let app: typeof import("../../index").default;

  beforeAll(async () => {
    await startMemoryMongo();
    app = (await import("../../index")).default;
  }, API_SUITE_HOOK_TIMEOUT_MS);

  afterAll(async () => {
    await stopMemoryMongo();
  });

  it("rejects publish-scheduled without Bearer CRON_SECRET", async () => {
    const res = await request(app).get("/api/cron/publish-scheduled");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects publish-scheduled with wrong secret", async () => {
    const res = await request(app).get("/api/cron/publish-scheduled").set("Authorization", "Bearer wrong-secret");
    expect(res.status).toBe(401);
  });

  it("accepts publish-scheduled with valid CRON_SECRET", async () => {
    const secret = process.env.CRON_SECRET || "vitest-cron-secret";
    const res = await request(app).get("/api/cron/publish-scheduled").set("Authorization", `Bearer ${secret}`);
    expect(res.status).toBeLessThan(500);
    expect(res.body.success).toBe(true);
  });
});
