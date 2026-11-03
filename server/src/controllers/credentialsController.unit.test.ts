import { beforeEach, describe, expect, it, vi } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

const serviceMocks = vi.hoisted(() => {
  type CredentialRow = { platform_name: string };
  return {
    getAllCredentials: vi.fn(async (): Promise<CredentialRow[]> => [{ platform_name: "devto" }]),
    getCredentialByPlatform: vi.fn(async (): Promise<CredentialRow | null> => ({ platform_name: "devto" })),
    upsertCredential: vi.fn(async (): Promise<CredentialRow> => ({ platform_name: "devto" })),
    deleteCredential: vi.fn(async (): Promise<void> => undefined),
  };
});

vi.mock("@services/credentialsService", () => serviceMocks);

const testWordpressConnection = vi.hoisted(() => vi.fn());

vi.mock("@services/wordpressService", () => ({
  testWordpressConnection: (...args: unknown[]) => testWordpressConnection(...args),
}));

import * as credentialsController from "./credentialsController";

describe("credentialsController", () => {
  const userId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list returns credentials", async () => {
    const json = vi.fn();
    await credentialsController.list({ userId } as never, { json } as never);
    expect(json).toHaveBeenCalledWith({ success: true, data: [{ platform_name: "devto" }] });
  });

  it("get returns 404 when missing", async () => {
    serviceMocks.getCredentialByPlatform.mockResolvedValueOnce(null);
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await credentialsController.get({ userId, params: { platform: "devto" } } as never, { json, status } as never);
    expect(status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({ success: false, error: ERROR_MESSAGES.CREDENTIALS_NOT_FOUND_PLATFORM });
  });

  it("upsert saves credential", async () => {
    const json = vi.fn();
    await credentialsController.upsert(
      { userId, params: { platform: "devto" }, body: { api_key: "x" } } as never,
      { json } as never,
    );
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Object) }));
  });

  it("remove deletes credential", async () => {
    const json = vi.fn();
    await credentialsController.remove({ userId, params: { platform: "devto" } } as never, { json } as never);
    expect(serviceMocks.deleteCredential).toHaveBeenCalledWith(userId, "devto");
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("list maps service failures to 500", async () => {
    serviceMocks.getAllCredentials.mockRejectedValueOnce(new Error("db down"));
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await credentialsController.list({ userId } as never, { json, status } as never);
    expect(status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });

  it("get maps service failures to 500", async () => {
    serviceMocks.getCredentialByPlatform.mockRejectedValueOnce(new Error("db down"));
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await credentialsController.get({ userId, params: { platform: "devto" } } as never, { json, status } as never);
    expect(status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });

  it("upsert forwards service status codes", async () => {
    const err = Object.assign(new Error("invalid key"), { status: HTTP_STATUS.BAD_REQUEST });
    serviceMocks.upsertCredential.mockRejectedValueOnce(err);
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await credentialsController.upsert(
      { userId, params: { platform: "devto" }, body: { api_key: "x" } } as never,
      { json, status } as never,
    );
    expect(status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
  });

  it("remove maps delete failures to 500", async () => {
    serviceMocks.deleteCredential.mockRejectedValueOnce(new Error("delete failed"));
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await credentialsController.remove({ userId, params: { platform: "devto" } } as never, { json, status } as never);
    expect(status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });

  it("testWordpress returns connection data on success", async () => {
    testWordpressConnection.mockResolvedValueOnce({ ok: true, siteUrl: "https://wp.test" });
    const json = vi.fn();
    await credentialsController.testWordpress({ userId } as never, { json } as never);
    expect(testWordpressConnection).toHaveBeenCalledWith(userId);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { ok: true, siteUrl: "https://wp.test" },
      }),
    );
  });

  it("testWordpress maps rate-limit failures to 429", async () => {
    testWordpressConnection.mockRejectedValueOnce(new Error(ERROR_MESSAGES.WORDPRESS_TEST_RATE_LIMITED));
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await credentialsController.testWordpress({ userId } as never, { json, status } as never);
    expect(status).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: ERROR_MESSAGES.WORDPRESS_TEST_RATE_LIMITED,
    });
  });
});
