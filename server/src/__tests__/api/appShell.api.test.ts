import { HEALTH } from "@constants";
import * as connection from "@database/connection";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";

describe("app shell routes (index.ts)", () => {
  let app: typeof import("../../index").default;

  beforeAll(async () => {
    await startMemoryMongo();
    app = (await import("../../index")).default;
  }, 120_000);

  afterAll(async () => {
    await stopMemoryMongo();
  });

  it("GET /favicon.ico returns 204", async () => {
    const res = await request(app).get("/favicon.ico");
    expect(res.status).toBe(204);
  });

  it("GET /health returns 503 when DB connect fails", async () => {
    vi.spyOn(connection, "default").mockRejectedValueOnce(new Error("mongo unavailable"));
    vi.spyOn(connection, "isDbConnected").mockReturnValueOnce(false);
    vi.spyOn(connection, "getDbConnectionMeta").mockReturnValueOnce({ host: "", name: "" });

    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body.database?.status).toBe(HEALTH.DB.DISCONNECTED);
    expect(res.body.database?.error).toMatch(/mongo unavailable/);
    vi.restoreAllMocks();
  });
});
