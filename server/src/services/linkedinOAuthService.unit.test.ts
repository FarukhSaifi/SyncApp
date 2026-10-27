import { config } from "@config";
import { PLATFORMS } from "@constants";
import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_MESSAGES } from "@constants/messages";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("@models/Credential", () => ({
  default: {
    findOneAndUpdate: vi.fn(() => ({
      lean: vi.fn(async () => ({ platform_name: PLATFORMS.LINKEDIN })),
    })),
  },
}));

vi.mock("@utils/encryption", () => ({
  decryptCredential: vi.fn((value: string) => value.replace("enc:", "")),
  encryptCredential: vi.fn((value: string) => `enc:${value}`),
}));

import {
  buildLinkedInAuthorizeUrl,
  completeLinkedInOAuth,
  getLinkedInRedirectUri,
  isLinkedInOAuthConfigured,
  resolveLinkedInAccess,
  settingsRedirectUrl,
} from "./linkedinOAuthService";

describe("linkedinOAuthService", () => {
  const original = {
    clientId: config.linkedinClientId,
    clientSecret: config.linkedinClientSecret,
    redirectUri: config.linkedinRedirectUri,
    jwtSecret: config.jwtSecret,
    siteUrl: config.siteUrl,
  };

  beforeEach(() => {
    config.linkedinClientId = "li-client";
    config.linkedinClientSecret = "li-secret";
    config.linkedinRedirectUri = "https://app.test/api/auth/linkedin/callback";
    config.jwtSecret = "test-jwt-secret-for-linkedin-oauth";
    config.siteUrl = "https://app.test";
    vi.clearAllMocks();
  });

  afterEach(() => {
    config.linkedinClientId = original.clientId;
    config.linkedinClientSecret = original.clientSecret;
    config.linkedinRedirectUri = original.redirectUri;
    config.jwtSecret = original.jwtSecret;
    config.siteUrl = original.siteUrl;
  });

  it("isLinkedInOAuthConfigured reflects config", () => {
    expect(isLinkedInOAuthConfigured()).toBe(true);
    config.linkedinClientId = "";
    expect(isLinkedInOAuthConfigured()).toBe(false);
  });

  it("buildLinkedInAuthorizeUrl includes client and redirect", () => {
    const url = buildLinkedInAuthorizeUrl("user-1");
    expect(url).toContain("client_id=li-client");
    expect(getLinkedInRedirectUri()).toBe(config.linkedinRedirectUri);
    expect(url).toContain(encodeURIComponent(config.linkedinRedirectUri));
  });

  it("settingsRedirectUrl builds settings query", () => {
    expect(settingsRedirectUrl({ connected: true })).toContain("settings");
    expect(settingsRedirectUrl({ error: "denied" })).toContain("denied");
  });

  it("resolveLinkedInAccess returns token when not expired", async () => {
    const future = new Date(Date.now() + 86_400_000);
    const ctx = await resolveLinkedInAccess({
      api_key: "enc:access-token",
      token_expires_at: future,
      platform_config: { linkedin_person_urn: "urn:li:person:abc" },
    });
    expect(ctx.accessToken).toBe("access-token");
    expect(ctx.personUrn).toContain("urn:li:person");
  });

  it("completeLinkedInOAuth exchanges code and stores credential", async () => {
    const userId = "507f1f77bcf86cd799439011";
    const authorizeUrl = buildLinkedInAuthorizeUrl(userId);
    const state = new URL(authorizeUrl).searchParams.get("state");
    expect(state).toBeTruthy();

    vi.mocked(axios.post).mockResolvedValue({
      data: { access_token: "new-token", expires_in: 3600, refresh_token: "refresh" },
    });
    vi.mocked(axios.get).mockResolvedValue({ data: { sub: "abc123" } });

    const resolvedUserId = await completeLinkedInOAuth("auth-code", state as string);
    expect(resolvedUserId).toBe(userId);
    expect(axios.post).toHaveBeenCalledOnce();
  });

  it("resolveLinkedInAccess refreshes expired token when refresh token stored", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { access_token: "refreshed", expires_in: 3600, refresh_token: "new-refresh" },
    });
    vi.mocked(axios.get).mockResolvedValue({ data: { sub: "abc123" } });

    const ctx = await resolveLinkedInAccess({
      api_key: "enc:expired-token",
      refresh_token: "enc:refresh-token",
      token_expires_at: new Date(Date.now() - 1000),
      platform_config: { linkedin_person_urn: "urn:li:person:abc" },
      author: "507f1f77bcf86cd799439011",
    });
    expect(ctx.accessToken).toBe("refreshed");
    expect(axios.post).toHaveBeenCalled();
  });

  it("completeLinkedInOAuth rejects invalid state", async () => {
    await expect(completeLinkedInOAuth("code", "not-a-valid-state")).rejects.toThrow(
      ERROR_MESSAGES.LINKEDIN_OAUTH_STATE_INVALID,
    );
  });

  it("resolveLinkedInAccess fails without person urn", async () => {
    await expect(resolveLinkedInAccess({ api_key: "enc:x" })).rejects.toThrow(
      ERROR_MESSAGES.LINKEDIN_PERSON_URN_MISSING,
    );
  });

  it("resolveLinkedInAccess rejects expired token when refresh is missing", async () => {
    await expect(
      resolveLinkedInAccess({
        api_key: "enc:expired",
        token_expires_at: new Date(Date.now() - 1000),
        platform_config: { linkedin_person_urn: "urn:li:person:abc" },
      }),
    ).rejects.toThrow(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN);
  });

  it("resolveLinkedInAccess rejects empty decrypted access token", async () => {
    const { decryptCredential } = await import("@utils/encryption");
    vi.mocked(decryptCredential).mockReturnValueOnce("");
    await expect(
      resolveLinkedInAccess({
        api_key: "enc:empty",
        platform_config: { linkedin_person_urn: "urn:li:person:abc" },
      }),
    ).rejects.toThrow(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN);
  });

  it("resolveLinkedInAccess maps refresh failures to invalid token", async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error("refresh denied"));
    await expect(
      resolveLinkedInAccess({
        api_key: "enc:expired",
        refresh_token: "enc:refresh",
        token_expires_at: new Date(Date.now() - 1000),
        platform_config: { linkedin_person_urn: "urn:li:person:abc" },
      }),
    ).rejects.toThrow(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN);
  });
});
