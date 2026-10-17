import { existsSync, readFileSync } from "fs";
import path from "path";

import { AI_CONFIG } from "@constants";
import { AppError } from "@middleware/errorHandler";
import type { GoogleServiceAccount } from "@types";

import { HTTP_STATUS } from "@constants/httpStatus";

export type { GoogleServiceAccount };

/** Resolve a credentials file path (server cwd, then repo root fallback). */
export function resolveGoogleCredentialsPath(credentialsPath: string): string {
  if (path.isAbsolute(credentialsPath)) {
    return credentialsPath;
  }

  const fromServerCwd = path.resolve(process.cwd(), credentialsPath);
  if (existsSync(fromServerCwd)) {
    return fromServerCwd;
  }

  const fromRepoRoot = path.resolve(process.cwd(), "..", path.basename(credentialsPath));
  if (existsSync(fromRepoRoot)) {
    return fromRepoRoot;
  }

  return fromServerCwd;
}

function parseCredentialsJson(raw: string, source: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new AppError(`Invalid Google credentials JSON (${source})`, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

function readCredentialsFile(): { data: Record<string, unknown>; source: string } | null {
  const jsonRaw = process.env[AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON]?.trim();
  if (jsonRaw) {
    return {
      data: parseCredentialsJson(jsonRaw, AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON),
      source: AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON,
    };
  }

  const credentialsPath = process.env[AI_CONFIG.ENV_GOOGLE_APPLICATION_CREDENTIALS]?.trim();
  if (!credentialsPath) {
    return null;
  }

  const resolvedPath = resolveGoogleCredentialsPath(credentialsPath);
  if (!existsSync(resolvedPath)) {
    throw new AppError(
      `Google credentials file not found at ${resolvedPath}. Place google-credentials.json at the repo root or set ${AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON}.`,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  }

  return {
    data: parseCredentialsJson(readFileSync(resolvedPath, "utf8"), resolvedPath),
    source: resolvedPath,
  };
}

function isServiceAccount(data: Record<string, unknown>): data is GoogleServiceAccount {
  const type = data[AI_CONFIG.CREDENTIAL_FIELD_TYPE];
  const hasEmail = typeof data[AI_CONFIG.CREDENTIAL_FIELD_CLIENT_EMAIL] === "string";
  const hasKey = typeof data[AI_CONFIG.CREDENTIAL_FIELD_PRIVATE_KEY] === "string";
  if (type === AI_CONFIG.CREDENTIAL_TYPE_SERVICE_ACCOUNT) {
    return hasEmail && hasKey;
  }
  // Legacy SA JSON without explicit type field
  return !type && hasEmail && hasKey;
}

/**
 * Load service-account credentials only (client_email + private_key).
 * Returns null when credentials are ADC/authorized_user or unset — callers may fall back to ADC.
 */
export function loadGoogleServiceAccountCredentials(): GoogleServiceAccount | null {
  const loaded = readCredentialsFile();
  if (!loaded) {
    return null;
  }
  if (!isServiceAccount(loaded.data)) {
    return null;
  }
  return loaded.data;
}

/** True when GOOGLE_APPLICATION_CREDENTIALS points at an existing file, or GOOGLE_CREDENTIALS_JSON is set. */
export function hasGoogleCloudCredentialsEnv(): boolean {
  if (process.env[AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON]?.trim()) {
    return true;
  }
  const credentialsPath = process.env[AI_CONFIG.ENV_GOOGLE_APPLICATION_CREDENTIALS]?.trim();
  if (!credentialsPath) {
    return false;
  }
  try {
    return existsSync(resolveGoogleCredentialsPath(credentialsPath));
  } catch {
    return false;
  }
}

/** Hint for Vertex client cache keys (SA email prefix or ADC). */
export function getVertexCredentialCacheHint(): string {
  try {
    const sa = loadGoogleServiceAccountCredentials();
    const emailRaw = sa?.[AI_CONFIG.CREDENTIAL_FIELD_CLIENT_EMAIL];
    if (typeof emailRaw === "string" && emailRaw.length > 0) {
      return emailRaw.slice(0, AI_CONFIG.SA_EMAIL_CACHE_HINT_LEN);
    }
  } catch {
    // ignore — fall through to ADC hint
  }
  return AI_CONFIG.ADC_CACHE_HINT;
}

/**
 * Service account email used to V4-sign GCS upload URLs when ADC is a user
 * refresh token (no client_email / private_key). Override with
 * GCS_SIGNING_SERVICE_ACCOUNT; otherwise VERTEX_SA_EMAIL.
 */
export function resolveGcsSigningServiceAccountEmail(): string {
  const fromEnv = process.env[AI_CONFIG["ENV_GCS_SIGNING_SERVICE_ACCOUNT"]]?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return AI_CONFIG["VERTEX_SA_EMAIL"];
}
