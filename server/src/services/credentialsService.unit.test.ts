import { ERROR_MESSAGES, PLATFORMS } from "@constants";
import { NotFoundError, ValidationError } from "@middleware/errorHandler";
import { cache, cacheKeys } from "@utils/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFind = vi.fn();
const mockFindOne = vi.fn();
const mockFindOneAndUpdate = vi.fn();
const mockFindOneAndDelete = vi.fn();

vi.mock("@models/Credential", () => ({
  default: {
    find: (...args: unknown[]) => mockFind(...args),
    findOne: (...args: unknown[]) => mockFindOne(...args),
    findOneAndUpdate: (...args: unknown[]) => mockFindOneAndUpdate(...args),
    findOneAndDelete: (...args: unknown[]) => mockFindOneAndDelete(...args),
  },
}));

vi.mock("@utils/encryption", () => ({
  encryptCredential: (v: string) => `enc:${v}`,
  decryptCredential: vi.fn((v: string) => {
    if (v === "enc:bad") {
      throw new Error("decrypt failed");
    }
    return v.replace(/^enc:/, "");
  }),
}));

import {
  deleteCredential,
  getAllCredentials,
  getCredentialByPlatform,
  upsertCredential,
} from "./credentialsService";

describe("credentialsService", () => {
  const userId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    vi.clearAllMocks();
    cache.clear();
  });

  it("getAllCredentials returns masked devto credentials", async () => {
    mockFind.mockReturnValue({
      lean: vi.fn(async () => [
        {
          platform_name: PLATFORMS.DEVTO,
          api_key: "enc:secret-key-1234",
          encrypted_payload: "enc:secret-key-1234",
        },
      ]),
    });
    const rows = await getAllCredentials(userId);
    expect(rows[0].configured).toBe(true);
    expect(rows[0].api_key).toBeUndefined();
    expect(rows[0].api_key_masked).toContain("1234");
  });

  it("getAllCredentials marks decrypt failures", async () => {
    mockFind.mockReturnValue({
      lean: vi.fn(async () => [
        {
          platform_name: PLATFORMS.MEDIUM,
          encrypted_payload: "enc:bad",
        },
      ]),
    });
    const rows = await getAllCredentials(userId);
    expect(rows[0].configured).toBe(false);
    expect(rows[0].decrypt_failed).toBe(true);
  });

  it("getCredentialByPlatform sanitizes linkedin oauth credential", async () => {
    mockFindOne.mockReturnValue({
      lean: vi.fn(async () => ({
        platform_name: PLATFORMS.LINKEDIN,
        api_key: "enc:token",
        refresh_token: "enc:refresh",
        token_expires_at: new Date(Date.now() + 86_400_000),
        platform_config: { linkedin_person_urn: "urn:li:person:abc" },
      })),
    });
    const row = await getCredentialByPlatform(userId, PLATFORMS.LINKEDIN);
    expect(row?.configured).toBe(true);
    expect(row?.api_key).toBeUndefined();
  });

  it("upsertCredential rejects linkedin manual api key", async () => {
    await expect(upsertCredential(userId, PLATFORMS.LINKEDIN, { api_key: "x" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("upsertCredential requires wordpress site url", async () => {
    await expect(upsertCredential(userId, PLATFORMS.WORDPRESS, { api_key: "x" })).rejects.toThrow(
      ERROR_MESSAGES.WORDPRESS_SITE_URL_REQUIRED,
    );
  });

  it("upsertCredential stores encrypted devto key", async () => {
    mockFindOneAndUpdate.mockReturnValue({
      lean: vi.fn(async () => ({
        platform_name: PLATFORMS.DEVTO,
        encrypted_payload: "enc:secret",
      })),
    });
    const row = await upsertCredential(userId, PLATFORMS.DEVTO, { api_key: "secret" });
    expect(row.configured).toBe(true);
    expect(mockFindOneAndUpdate).toHaveBeenCalledOnce();
  });

  it("deleteCredential throws when missing", async () => {
    mockFindOneAndDelete.mockResolvedValue(null);
    await expect(deleteCredential(userId, PLATFORMS.DEVTO)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deleteCredential removes credential and clears cache", async () => {
    mockFindOneAndDelete.mockResolvedValue({ platform_name: PLATFORMS.DEVTO });
    await deleteCredential(userId, PLATFORMS.DEVTO);
    expect(mockFindOneAndDelete).toHaveBeenCalledOnce();
  });

  it("getAllCredentials returns cached list without querying db", async () => {
    const cached = [{ platform_name: PLATFORMS.DEVTO, configured: true }];
    cache.set(cacheKeys.credentials.list(userId), cached, 60_000);
    const rows = await getAllCredentials(userId);
    expect(rows).toBe(cached);
    expect(mockFind).not.toHaveBeenCalled();
  });

  it("getCredentialByPlatform returns null when missing", async () => {
    mockFindOne.mockReturnValue({
      lean: vi.fn(async () => null),
    });
    const row = await getCredentialByPlatform(userId, PLATFORMS.DEVTO);
    expect(row).toBeNull();
  });

  it("getCredentialByPlatform marks linkedin token expired without refresh", async () => {
    mockFindOne.mockReturnValue({
      lean: vi.fn(async () => ({
        platform_name: PLATFORMS.LINKEDIN,
        api_key: "enc:token",
        token_expires_at: new Date(Date.now() - 1000),
        platform_config: { linkedin_person_urn: "urn:li:person:abc" },
      })),
    });
    const row = await getCredentialByPlatform(userId, PLATFORMS.LINKEDIN);
    expect(row?.configured).toBe(false);
    expect(row?.token_expired).toBe(true);
  });

  it("upsertCredential rejects missing api key", async () => {
    await expect(upsertCredential(userId, PLATFORMS.DEVTO, {})).rejects.toBeInstanceOf(ValidationError);
  });

  it("upsertCredential stores wordpress site url and platform_config", async () => {
    mockFindOneAndUpdate.mockReturnValue({
      lean: vi.fn(async () => ({
        platform_name: PLATFORMS.WORDPRESS,
        encrypted_payload: "enc:secret",
        site_url: "https://wp.test",
        platform_config: { wordpress_url: "https://wp.test" },
      })),
    });
    const row = await upsertCredential(userId, PLATFORMS.WORDPRESS, {
      api_key: "secret",
      site_url: "https://wp.test",
      platform_config: { wordpress_url: "https://wp.test" },
    });
    expect(row.configured).toBe(true);
    expect(row.site_url).toBe("https://wp.test");
  });
});
