import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";

describe("404 handler (memory Mongo)", () => {
  let app: typeof import("../../index").default;

  beforeAll(async () => {
    await startMemoryMongo();
    app = (await import("../../index")).default;
  }, 120_000);

  afterAll(async () => {
    await stopMemoryMongo();
  });

  it("returns 404 JSON for unknown API routes", async () => {
    const res = await request(app).get("/api/does-not-exist-route");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
