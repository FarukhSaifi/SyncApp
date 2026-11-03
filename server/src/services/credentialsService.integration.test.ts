import { ERROR_MESSAGES, PLATFORMS } from "@constants";
import { ValidationError } from "@middleware/errorHandler";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";


import {
  deleteCredential,
  getAllCredentials,
  getCredentialByPlatform,
  upsertCredential,
} from "./credentialsService";

import { registerUser } from "../__tests__/helpers/authApi";
import { clearMemoryMongo, startMemoryMongo, stopMemoryMongo } from "../__tests__/helpers/memoryMongo";


describe("credentialsService (memory Mongo)", () => {
  let userId: string;

  beforeAll(async () => {
    await startMemoryMongo();
    const app = (await import("../index")).default;
    const auth = await registerUser(app);
    userId = auth.userId;
  }, 120_000);

  afterAll(async () => {
    await stopMemoryMongo();
  });

  beforeEach(async () => {
    await clearMemoryMongo();
    const app = (await import("../index")).default;
    const auth = await registerUser(app);
    userId = auth.userId;
  });

  it("upserts devto credential and lists masked key", async () => {
    await upsertCredential(userId, PLATFORMS.DEVTO, { api_key: "sk-integration-key" });
    const one = await getCredentialByPlatform(userId, PLATFORMS.DEVTO);
    expect(one?.configured).toBe(true);
    expect(one?.api_key_masked).toBeTruthy();

    const all = await getAllCredentials(userId);
    expect(all).toHaveLength(1);
  });

  it("rejects LinkedIn api_key paste", async () => {
    await expect(upsertCredential(userId, PLATFORMS.LINKEDIN, { api_key: "x" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("requires WordPress site_url", async () => {
    await expect(upsertCredential(userId, PLATFORMS.WORDPRESS, { api_key: "x" })).rejects.toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_REQUIRED,
    );
  });

  it("deleteCredential throws when missing", async () => {
    await expect(deleteCredential(userId, PLATFORMS.MEDIUM)).rejects.toThrow(ERROR_MESSAGES.CREDENTIAL_NOT_FOUND);
  });
});
