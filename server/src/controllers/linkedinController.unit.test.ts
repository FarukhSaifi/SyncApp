import { config } from "@config";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_MESSAGES } from "@constants/messages";

const linkedinOAuthMocks = vi.hoisted(() => ({
  completeLinkedInOAuth: vi.fn(async () => undefined),
  buildLinkedInAuthorizeUrl: vi.fn(() => "https://linkedin.test/oauth/authorize"),
  settingsRedirectUrl: vi.fn((q: Record<string, string | boolean>) => `https://app.test/settings?${JSON.stringify(q)}`),
}));

const isLinkedInOAuthConfigured = vi.hoisted(() => vi.fn(() => true));

vi.mock("@services/linkedinOAuthService", () => ({
  buildLinkedInAuthorizeUrl: linkedinOAuthMocks.buildLinkedInAuthorizeUrl,
  completeLinkedInOAuth: linkedinOAuthMocks.completeLinkedInOAuth,
  getLinkedInRedirectUri: vi.fn(() => "https://app.test/api/linkedin/oauth/callback"),
  isLinkedInOAuthConfigured,
  settingsRedirectUrl: linkedinOAuthMocks.settingsRedirectUrl,
}));

import { oauthCallback, oauthStart, oauthStatus } from "./linkedinController";

async function flushAsyncHandler(
  handler: (req: unknown, res: unknown, next: (err?: unknown) => void) => void,
  req: unknown,
  res: unknown,
): Promise<void> {
  handler(req, res, vi.fn());
  await vi.waitFor(
    () => {
      expect(vi.mocked(res as { json?: ReturnType<typeof vi.fn> }).json).toHaveBeenCalled();
    },
    { timeout: 2000 },
  );
}

describe("linkedinController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.siteUrl = "https://app.test";
  });

  it("oauthStart rejects when LinkedIn OAuth is not configured", async () => {
    isLinkedInOAuthConfigured.mockReturnValueOnce(false);
    const next = vi.fn();
    oauthStart({ userId: "507f1f77bcf86cd799439011" } as never, { json: vi.fn() } as never, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalled(), { timeout: 2000 });
    expect((next.mock.calls[0][0] as Error).message).toBe(ERROR_MESSAGES.LINKEDIN_NOT_CONFIGURED);
  });

  it("oauthStart returns authorize URL", async () => {
    const json = vi.fn();
    const req = { userId: "507f1f77bcf86cd799439011" };
    const res = { json };
    await flushAsyncHandler(oauthStart as never, req, res);
    expect(json).toHaveBeenCalledWith({ success: true, data: { url: "https://linkedin.test/oauth/authorize" } });
    expect(linkedinOAuthMocks.buildLinkedInAuthorizeUrl).toHaveBeenCalledOnce();
  });

  it("oauthCallback redirects on success", async () => {
    const redirect = vi.fn();
    await oauthCallback(
      { query: { code: "auth-code", state: "signed-state" } } as never,
      { redirect } as never,
    );
    expect(linkedinOAuthMocks.completeLinkedInOAuth).toHaveBeenCalledWith("auth-code", "signed-state");
    expect(redirect).toHaveBeenCalledWith(linkedinOAuthMocks.settingsRedirectUrl({ connected: true }));
  });

  it("oauthCallback redirects when LinkedIn denies", async () => {
    const redirect = vi.fn();
    await oauthCallback({ query: { error: "access_denied" } } as never, { redirect } as never);
    expect(redirect).toHaveBeenCalledWith(
      linkedinOAuthMocks.settingsRedirectUrl({ error: ERROR_MESSAGES.LINKEDIN_OAUTH_DENIED }),
    );
  });

  it("oauthStatus returns configuration snapshot", async () => {
    const json = vi.fn();
    await flushAsyncHandler(oauthStatus as never, {}, { json });
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ configured: true }),
      }),
    );
  });
});
