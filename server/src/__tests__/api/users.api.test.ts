import User from "@models/User";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { USER_ROLES } from "@constants/userRoles";

import { registerUser } from "../helpers/authApi";
import { clearMemoryMongo, startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";

describe("users API (admin, memory Mongo)", () => {
  let app: typeof import("../../index").default;
  let adminToken: string;

  beforeAll(async () => {
    await startMemoryMongo();
    app = (await import("../../index")).default;
  }, 120_000);

  afterAll(async () => {
    await stopMemoryMongo();
  });

  beforeEach(async () => {
    await clearMemoryMongo();
    const auth = await registerUser(app, { username: "admin_user" });
    await User.findByIdAndUpdate(auth.userId, { role: USER_ROLES.ADMIN });
    adminToken = auth.token;
  });

  it("lists users for admin", async () => {
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("rejects users routes for non-admin", async () => {
    const user = await registerUser(app, { username: "regular_user" });
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(403);
  });

  it("creates and deletes a user as admin", async () => {
    const created = await request(app).post("/api/users").set("Authorization", `Bearer ${adminToken}`).send({
      username: "managed_user",
      email: "managed@example.com",
      password: "password1",
      role: USER_ROLES.USER,
    });
    expect(created.status).toBe(201);
    const id = created.body.data._id as string;

    const got = await request(app).get(`/api/users/${id}`).set("Authorization", `Bearer ${adminToken}`);
    expect(got.status).toBe(200);

    const deleted = await request(app).delete(`/api/users/${id}`).set("Authorization", `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);
  });
});
