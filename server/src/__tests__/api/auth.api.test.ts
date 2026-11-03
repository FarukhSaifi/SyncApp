import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { clearMemoryMongo, startMemoryMongo, stopMemoryMongo } from "../helpers/memoryMongo";

describe("auth API (memory Mongo)", () => {
  let app: typeof import("../../index").default;

  beforeAll(async () => {
    await startMemoryMongo();
    app = (await import("../../index")).default;
  }, 120_000);

  afterAll(async () => {
    await stopMemoryMongo();
  });

  beforeEach(async () => {
    await clearMemoryMongo();
  });

  it("creates user and returns token when registration payload is valid", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "vitest_user",
      email: "vitest@example.com",
      password: "password1",
      firstName: "Vi",
      lastName: "Test",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.token).toBeTruthy();
    expect(res.body.data?.user?.email).toBe("vitest@example.com");
  });

  it("returns token when credentials are valid", async () => {
    await request(app).post("/api/auth/register").send({
      username: "login_user",
      email: "login@example.com",
      password: "password1",
    });
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "password1",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.token).toBeTruthy();
  });

  it("rejects login when password is wrong", async () => {
    await request(app).post("/api/auth/register").send({
      username: "bad_pw",
      email: "badpw@example.com",
      password: "password1",
    });
    const res = await request(app).post("/api/auth/login").send({
      email: "badpw@example.com",
      password: "wrong-password",
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns current user when token is valid", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      username: "me_user",
      email: "me@example.com",
      password: "password1",
    });
    const token = reg.body.data.token as string;
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.email).toBe("me@example.com");
  });

  it("rejects me when token is missing or malformed", async () => {
    const missing = await request(app).get("/api/auth/me");
    expect(missing.status).toBe(401);
    const bad = await request(app).get("/api/auth/me").set("Authorization", "Bearer not-a-jwt");
    expect(bad.status).toBe(401);
  });

  it("rejects duplicate registration", async () => {
    await request(app).post("/api/auth/register").send({
      username: "dup_user",
      email: "dup@example.com",
      password: "password1",
    });
    const res = await request(app).post("/api/auth/register").send({
      username: "dup_user",
      email: "dup@example.com",
      password: "password1",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("updates profile and changes password", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      username: "profile_user",
      email: "profile@example.com",
      password: "password1",
    });
    const token = reg.body.data.token as string;

    const profile = await request(app)
      .put("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Pro", lastName: "File", bio: "vitest" });
    expect(profile.status).toBe(200);
    expect(profile.body.data.firstName).toBe("Pro");

    const badPw = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "wrong", newPassword: "password2" });
    expect(badPw.status).toBe(400);

    const okPw = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "password1", newPassword: "password2" });
    expect(okPw.status).toBe(200);

    const login = await request(app).post("/api/auth/login").send({
      email: "profile@example.com",
      password: "password2",
    });
    expect(login.status).toBe(200);
  });
});
