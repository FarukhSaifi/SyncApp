/**
 * LinkedIn OAuth (authorization code) + token refresh helpers.
 */
import axios from "axios";
import dayjs from "dayjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { API_URLS, ERROR_MESSAGES, HTTP, PLATFORMS } from "../constants";
import { ValidationError } from "../middleware/errorHandler";
import Credential from "../models/Credential";
import { cache, cacheKeys } from "../utils/cache";
import { decrypt, encrypt } from "../utils/encryption";
import { createLogger } from "../utils/logger";
import { toObjectId } from "../utils/objectId";

const logger = createLogger("LINKEDIN_OAUTH");

const OAUTH_STATE_PURPOSE = "linkedin_oauth";
const OAUTH_STATE_EXPIRES = "10m";
/** Refresh a few minutes before expiry. */
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;

type LinkedInOAuthState = {
  userId: string;
  purpose: typeof OAUTH_STATE_PURPOSE;
};

export function isLinkedInOAuthConfigured(): boolean {
  return Boolean(config.linkedinClientId && config.linkedinClientSecret && config.linkedinRedirectUri);
}

/** Exact redirect URI SyncApp sends to LinkedIn (must match the Developer app Auth tab). */
export function getLinkedInRedirectUri(): string {
  return config.linkedinRedirectUri;
}

function assertLinkedInConfigured() {
  if (!isLinkedInOAuthConfigured()) {
    throw new ValidationError(ERROR_MESSAGES.LINKEDIN_NOT_CONFIGURED);
  }
}

export function buildLinkedInAuthorizeUrl(userId: string): string {
  assertLinkedInConfigured();

  const state = jwt.sign({ userId, purpose: OAUTH_STATE_PURPOSE } satisfies LinkedInOAuthState, config.jwtSecret, {
    expiresIn: OAUTH_STATE_EXPIRES,
  });

  // LinkedIn expects space-delimited scopes as %20 (not +). Build query manually for that.
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.linkedinClientId,
    redirect_uri: config.linkedinRedirectUri,
    state,
  });

  return `${API_URLS.LINKEDIN.AUTHORIZE_URL}?${params.toString()}&scope=${encodeURIComponent(API_URLS.LINKEDIN.SCOPES)}`;
}

function verifyOAuthState(state: string): string {
  try {
    const decoded = jwt.verify(state, config.jwtSecret) as LinkedInOAuthState;
    if (decoded.purpose !== OAUTH_STATE_PURPOSE || !decoded.userId) {
      throw new Error("bad purpose");
    }
    return decoded.userId;
  } catch {
    throw new ValidationError(ERROR_MESSAGES.LINKEDIN_OAUTH_STATE_INVALID);
  }
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
};

async function exchangeAuthorizationCode(code: string): Promise<TokenResponse> {
  assertLinkedInConfigured();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: config.linkedinClientId,
    client_secret: config.linkedinClientSecret,
    redirect_uri: config.linkedinRedirectUri,
  });

  const response = await axios.post<TokenResponse>(API_URLS.LINKEDIN.TOKEN_URL, body.toString(), {
    headers: { [HTTP.HEADERS.CONTENT_TYPE]: "application/x-www-form-urlencoded" },
  });

  if (!response.data?.access_token) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN);
  }

  return response.data;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  assertLinkedInConfigured();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.linkedinClientId,
    client_secret: config.linkedinClientSecret,
  });

  const response = await axios.post<TokenResponse>(API_URLS.LINKEDIN.TOKEN_URL, body.toString(), {
    headers: { [HTTP.HEADERS.CONTENT_TYPE]: "application/x-www-form-urlencoded" },
  });

  if (!response.data?.access_token) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN);
  }

  return response.data;
}

async function fetchPersonUrn(accessToken: string): Promise<string> {
  const response = await axios.get<{ sub?: string }>(API_URLS.LINKEDIN.USERINFO_URL, {
    headers: {
      [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BEARER} ${accessToken}`,
    },
  });

  const sub = response.data?.sub?.trim();
  if (!sub) {
    throw new ValidationError(ERROR_MESSAGES.LINKEDIN_PERSON_URN_MISSING);
  }

  return sub.startsWith("urn:li:person:") ? sub : `urn:li:person:${sub}`;
}

export async function upsertLinkedInCredential(userId: string, tokens: TokenResponse, personUrn: string) {
  const author = toObjectId(userId);
  const expiresAt = dayjs()
    .add(tokens.expires_in || 0, "second")
    .toDate();

  const updateData: Record<string, unknown> = {
    author,
    api_key: encrypt(tokens.access_token),
    is_active: true,
    token_expires_at: expiresAt,
    platform_config: {
      linkedin_person_urn: personUrn,
    },
  };

  if (tokens.refresh_token) {
    updateData.refresh_token = encrypt(tokens.refresh_token);
  }

  const credential = await Credential.findOneAndUpdate({ author, platform_name: PLATFORMS.LINKEDIN }, updateData, {
    upsert: true,
    new: true,
    runValidators: true,
  }).lean();

  cache.delete(cacheKeys.credentials.single(userId, PLATFORMS.LINKEDIN));
  cache.delete(cacheKeys.credentials.list(userId));

  return credential;
}

/**
 * Complete OAuth callback: exchange code, fetch member URN, store credential.
 * Returns the authenticated user id for redirect.
 */
export async function completeLinkedInOAuth(code: string, state: string): Promise<string> {
  const userId = verifyOAuthState(state);
  const tokens = await exchangeAuthorizationCode(code);
  const personUrn = await fetchPersonUrn(tokens.access_token);
  await upsertLinkedInCredential(userId, tokens, personUrn);
  logger.info("LinkedIn OAuth connected", { userId });
  return userId;
}

export type LinkedInAccessContext = {
  accessToken: string;
  personUrn: string;
};

/**
 * Decrypt LinkedIn access token, refreshing when near expiry.
 */
export async function resolveLinkedInAccess(credential: {
  _id?: unknown;
  author?: unknown;
  api_key: string;
  refresh_token?: string;
  token_expires_at?: Date;
  platform_config?: { linkedin_person_urn?: string };
}): Promise<LinkedInAccessContext> {
  const personUrn = credential.platform_config?.linkedin_person_urn?.trim();
  if (!personUrn) {
    throw new Error(ERROR_MESSAGES.LINKEDIN_PERSON_URN_MISSING);
  }

  let accessToken = decrypt(credential.api_key);
  if (!accessToken) {
    throw new Error(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN);
  }

  const expiresAt = credential.token_expires_at ? dayjs(credential.token_expires_at) : null;
  const needsRefresh = !expiresAt || expiresAt.valueOf() - Date.now() < TOKEN_REFRESH_SKEW_MS;

  if (needsRefresh && credential.refresh_token) {
    try {
      const refreshToken = decrypt(credential.refresh_token);
      if (refreshToken) {
        const tokens = await refreshAccessToken(refreshToken);
        accessToken = tokens.access_token;
        const authorId =
          typeof credential.author === "object" && credential.author && "toString" in credential.author
            ? (credential.author as { toString(): string }).toString()
            : String(credential.author || "");

        if (authorId) {
          await upsertLinkedInCredential(authorId, tokens, personUrn);
        }
      }
    } catch (error) {
      logger.warn("LinkedIn token refresh failed; using existing access token", {
        error: (error as Error).message,
      });
    }
  }

  return { accessToken, personUrn };
}

export function settingsRedirectUrl(params: { connected?: boolean; error?: string }): string {
  const base = (config.siteUrl || "http://localhost:3000").replace(/\/$/, "");
  const query = new URLSearchParams();
  if (params.connected) query.set("linkedin", "connected");
  if (params.error) query.set("linkedin_error", params.error);
  const qs = query.toString();
  return `${base}/settings${qs ? `?${qs}` : ""}`;
}
