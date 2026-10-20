/**
 * LinkedIn OAuth (authorization code) + token refresh helpers.
 */

import { config } from "@config";
import { API_URLS, DEFAULT_VALUES, ERROR_MESSAGES, HTTP, PLATFORMS } from "@constants";
import { ValidationError } from "@middleware/errorHandler";
import Credential from "@models/Credential";
import type { LinkedInAccessContext } from "@types";
import { cache, cacheKeys } from "@utils/cache";
import { decryptCredential, encryptCredential } from "@utils/encryption";
import { createLogger } from "@utils/logger";
import { toObjectId } from "@utils/objectId";
import axios from "axios";
import dayjs from "dayjs";
import jwt from "jsonwebtoken";

export type { LinkedInAccessContext };

const logger = createLogger("LINKEDIN_OAUTH");

const LINKEDIN = API_URLS.LINKEDIN;

type LinkedInOAuthState = {
  userId: string;
  purpose: typeof LINKEDIN.OAUTH_STATE_PURPOSE;
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

  const state = jwt.sign(
    { userId, purpose: LINKEDIN.OAUTH_STATE_PURPOSE } satisfies LinkedInOAuthState,
    config.jwtSecret,
    {
      expiresIn: LINKEDIN.OAUTH_STATE_JWT_EXPIRES,
    },
  );

  // LinkedIn expects space-delimited scopes as %20 (not +). Build query manually for that.
  const params = new URLSearchParams({
    response_type: LINKEDIN.OAUTH_RESPONSE_TYPE,
    client_id: config.linkedinClientId,
    redirect_uri: config.linkedinRedirectUri,
    state,
  });

  return `${LINKEDIN.AUTHORIZE_URL}?${params.toString()}&scope=${encodeURIComponent(LINKEDIN.SCOPES)}`;
}

function verifyOAuthState(state: string): string {
  try {
    const decoded = jwt.verify(state, config.jwtSecret) as LinkedInOAuthState;
    if (decoded.purpose !== LINKEDIN.OAUTH_STATE_PURPOSE || !decoded.userId) {
      throw new Error(ERROR_MESSAGES.LINKEDIN_OAUTH_STATE_INVALID);
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
    grant_type: LINKEDIN.OAUTH_GRANT_AUTHORIZATION_CODE,
    code,
    client_id: config.linkedinClientId,
    client_secret: config.linkedinClientSecret,
    redirect_uri: config.linkedinRedirectUri,
  });

  const response = await axios.post<TokenResponse>(LINKEDIN.TOKEN_URL, body.toString(), {
    headers: { [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.FORM_URLENCODED },
  });

  if (!response.data?.access_token) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN);
  }

  return response.data;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  assertLinkedInConfigured();
  const body = new URLSearchParams({
    grant_type: LINKEDIN.OAUTH_GRANT_REFRESH_TOKEN,
    refresh_token: refreshToken,
    client_id: config.linkedinClientId,
    client_secret: config.linkedinClientSecret,
  });

  const response = await axios.post<TokenResponse>(LINKEDIN.TOKEN_URL, body.toString(), {
    headers: { [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.FORM_URLENCODED },
  });

  if (!response.data?.access_token) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN);
  }

  return response.data;
}

async function fetchPersonUrn(accessToken: string): Promise<string> {
  const response = await axios.get<{ sub?: string }>(LINKEDIN.USERINFO_URL, {
    headers: {
      [HTTP.HEADERS.AUTHORIZATION]: `${HTTP.AUTH_SCHEMES.BEARER} ${accessToken}`,
    },
  });

  const sub = response.data?.sub?.trim();
  if (!sub) {
    throw new ValidationError(ERROR_MESSAGES.LINKEDIN_PERSON_URN_MISSING);
  }

  return sub.startsWith(LINKEDIN.PERSON_URN_PREFIX) ? sub : `${LINKEDIN.PERSON_URN_PREFIX}${sub}`;
}

export async function upsertLinkedInCredential(userId: string, tokens: TokenResponse, personUrn: string) {
  const author = toObjectId(userId);
  const expiresAt = dayjs()
    .add(tokens.expires_in || 0, "second")
    .toDate();

  const encryptedAccessToken = encryptCredential(tokens.access_token);
  const updateData: Record<string, unknown> = {
    author,
    api_key: encryptedAccessToken,
    encrypted_payload: encryptedAccessToken,
    is_active: true,
    token_expires_at: expiresAt,
    platform_config: {
      linkedin_person_urn: personUrn,
    },
  };

  if (tokens.refresh_token) {
    updateData.refresh_token = encryptCredential(tokens.refresh_token);
  }

  const credential = await Credential.findOneAndUpdate({ author, platform_name: PLATFORMS.LINKEDIN }, updateData, {
    upsert: true,
    returnDocument: "after",
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

function authorIdFromCredential(author: unknown): string {
  if (typeof author === "object" && author && "toString" in author) {
    return (author as { toString(): string }).toString();
  }
  return String(author || "");
}

/**
 * Decrypt LinkedIn access token, refreshing when near expiry.
 * Expired tokens without a successful refresh fail hard — never call LinkedIn with a dead token.
 */
export async function resolveLinkedInAccess(credential: {
  _id?: unknown;
  author?: unknown;
  api_key?: string;
  encrypted_payload?: string;
  refresh_token?: string;
  token_expires_at?: Date;
  platform_config?: { linkedin_person_urn?: string };
}): Promise<LinkedInAccessContext> {
  const personUrn = credential.platform_config?.linkedin_person_urn?.trim();
  if (!personUrn) {
    throw new Error(ERROR_MESSAGES.LINKEDIN_PERSON_URN_MISSING);
  }

  const packed = credential.encrypted_payload || credential.api_key || "";
  let accessToken = packed ? decryptCredential(packed) : "";
  if (!accessToken) {
    throw new Error(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN);
  }

  const expiresAt = credential.token_expires_at ? dayjs(credential.token_expires_at) : null;
  const needsRefresh = !expiresAt || expiresAt.valueOf() - Date.now() < LINKEDIN.TOKEN_REFRESH_SKEW_MS;

  if (!needsRefresh) {
    return { accessToken, personUrn };
  }

  if (!credential.refresh_token) {
    logger.warn("LinkedIn access token expired and no refresh token is stored");
    throw new Error(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN);
  }

  try {
    const refreshToken = decryptCredential(credential.refresh_token);
    if (!refreshToken) {
      throw new Error(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN);
    }

    const tokens = await refreshAccessToken(refreshToken);
    accessToken = tokens.access_token;
    const authorId = authorIdFromCredential(credential.author);
    if (authorId) {
      await upsertLinkedInCredential(authorId, tokens, personUrn);
    }
  } catch (error) {
    logger.warn("LinkedIn token refresh failed", {
      error: (error as Error).message,
    });
    throw new Error(ERROR_MESSAGES.INVALID_LINKEDIN_TOKEN, { cause: error });
  }

  return { accessToken, personUrn };
}

export function settingsRedirectUrl(params: { connected?: boolean; error?: string }): string {
  const base = (config.siteUrl || DEFAULT_VALUES.DEFAULT_CORS_ORIGIN).replace(/\/$/, "");
  const query = new URLSearchParams();
  const { CONNECTED_KEY, CONNECTED_VALUE, ERROR_KEY } = LINKEDIN.SETTINGS_QUERY;
  if (params.connected) {
    query.set(CONNECTED_KEY, CONNECTED_VALUE);
  }
  if (params.error) {
    query.set(ERROR_KEY, params.error);
  }
  const qs = query.toString();
  return `${base}${DEFAULT_VALUES.CLIENT_SETTINGS_PATH}${qs ? `?${qs}` : ""}`;
}
