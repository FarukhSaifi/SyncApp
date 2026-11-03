import type { Application } from "express";
import request from "supertest";

export async function registerUser(
  app: Application,
  overrides: { username?: string; email?: string; password?: string } = {},
): Promise<{ token: string; userId: string }> {
  const suffix = Date.now();
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      username: overrides.username ?? `user_${suffix}`,
      email: overrides.email ?? `user-${suffix}@example.com`,
      password: overrides.password ?? "password1",
    });
  if (res.status >= 400) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return {
    token: res.body.data.token as string,
    userId: res.body.data.user.id as string,
  };
}
