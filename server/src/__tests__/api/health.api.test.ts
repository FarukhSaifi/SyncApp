import { HEALTH } from "@constants";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";

describe("health and root (memory Mongo)", () => {
  let app: typeof import("../../index").default;

  beforeAll(async () => {
    await startMemoryMongo();
    app = (await import("../../index")).default;
  }, 120_000);

  afterAll(async () => {
    await stopMemoryMongo();
  });

  it("GET / returns service metadata", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.health).toBe("/health");
  });

  it("GET /health reports database connected", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(HEALTH.STATUS.OK);
    expect(res.body.database?.status).toBe(HEALTH.DB.CONNECTED);
    expect(res.body.services?.mongodb).toBe(HEALTH.SERVICE.HEALTHY);
  });
});
