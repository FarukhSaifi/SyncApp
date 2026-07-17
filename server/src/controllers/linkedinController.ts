import type { Request, Response } from "express";
import { API_URLS, ERROR_MESSAGES } from "../constants";
import { asyncHandler, ValidationError } from "../middleware/errorHandler";
import {
  buildLinkedInAuthorizeUrl,
  completeLinkedInOAuth,
  getLinkedInRedirectUri,
  isLinkedInOAuthConfigured,
  settingsRedirectUrl,
} from "../services/linkedinOAuthService";
import { createLogger } from "../utils/logger";

const logger = createLogger("LINKEDIN");

/**
 * Authenticated: returns LinkedIn authorize URL (client redirects browser).
 */
export const oauthStart = asyncHandler(async (req: Request, res: Response) => {
  if (!isLinkedInOAuthConfigured()) {
    throw new ValidationError(ERROR_MESSAGES.LINKEDIN_NOT_CONFIGURED);
  }

  const url = buildLinkedInAuthorizeUrl(req.userId!);
  res.json({ success: true, data: { url } });
});

/**
 * Browser redirect from LinkedIn — no JWT header; user id is in signed state.
 */
export async function oauthCallback(req: Request, res: Response): Promise<void> {
  try {
    const error = typeof req.query.error === "string" ? req.query.error : "";
    if (error) {
      res.redirect(settingsRedirectUrl({ error: ERROR_MESSAGES.LINKEDIN_OAUTH_DENIED }));
      return;
    }

    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";

    if (!code || !state) {
      res.redirect(settingsRedirectUrl({ error: ERROR_MESSAGES.LINKEDIN_OAUTH_STATE_INVALID }));
      return;
    }

    await completeLinkedInOAuth(code, state);
    res.redirect(settingsRedirectUrl({ connected: true }));
  } catch (err) {
    logger.error("LinkedIn OAuth callback failed", err as Error);
    const message = (err as Error).message || ERROR_MESSAGES.LINKEDIN_OAUTH_STATE_INVALID;
    res.redirect(settingsRedirectUrl({ error: message }));
  }
}

export const oauthStatus = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      configured: isLinkedInOAuthConfigured(),
      /** Exact value SyncApp sends to LinkedIn — must match Auth → Authorized redirect URLs. */
      redirectUri: isLinkedInOAuthConfigured() ? getLinkedInRedirectUri() : "",
      scopes: isLinkedInOAuthConfigured() ? API_URLS.LINKEDIN.SCOPES : "",
    },
  });
});
