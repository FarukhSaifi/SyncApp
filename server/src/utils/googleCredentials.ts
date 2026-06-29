import { existsSync, readFileSync } from "fs";
import path from "path";

import { config } from "../config";
import { HTTP_STATUS } from "../constants/httpStatus";
import { AppError } from "../middleware/errorHandler";

export type GoogleServiceAccount = Record<string, unknown> & { project_id?: string };

/** Resolve a credentials file path (server cwd, then repo root fallback). */
export function resolveGoogleCredentialsPath(credentialsPath: string): string {
  if (path.isAbsolute(credentialsPath)) return credentialsPath;

  const fromServerCwd = path.resolve(process.cwd(), credentialsPath);
  if (existsSync(fromServerCwd)) return fromServerCwd;

  const fromRepoRoot = path.resolve(process.cwd(), "..", path.basename(credentialsPath));
  if (existsSync(fromRepoRoot)) return fromRepoRoot;

  return fromServerCwd;
}

function parseCredentialsJson(raw: string, source: string): GoogleServiceAccount {
  try {
    return JSON.parse(raw) as GoogleServiceAccount;
  } catch {
    throw new AppError(`Invalid Google credentials JSON (${source})`, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/** Load service account credentials from GOOGLE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS file. */
export function loadGoogleServiceAccountCredentials(): GoogleServiceAccount | null {
  const jsonRaw = process.env.GOOGLE_CREDENTIALS_JSON?.trim();

  if (jsonRaw) {
    return parseCredentialsJson(jsonRaw, "GOOGLE_CREDENTIALS_JSON");
  }

  const credentialsPath = config.googleApplicationCredentials?.trim();
  if (!credentialsPath) return null;

  const resolvedPath = resolveGoogleCredentialsPath(credentialsPath);
  if (!existsSync(resolvedPath)) {
    throw new AppError(
      `Google credentials file not found at ${resolvedPath}. Place google-credentials.json at the repo root or set GOOGLE_CREDENTIALS_JSON.`,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  }

  return parseCredentialsJson(readFileSync(resolvedPath, "utf8"), resolvedPath);
}
