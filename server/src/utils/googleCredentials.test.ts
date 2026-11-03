import path from "path";

import { AI_CONFIG } from "@constants";
import { afterEach, describe, expect, it, vi } from "vitest";

const existsSync = vi.hoisted(() => vi.fn((_path: string) => false));
const readFileSync = vi.hoisted(() => vi.fn((_path?: string, _encoding?: string) => ""));

vi.mock("fs", () => ({
  existsSync,
  readFileSync,
}));

import {
  getVertexCredentialCacheHint,
  hasGoogleCloudCredentialsEnv,
  loadGoogleServiceAccountCredentials,
  resolveGcsSigningServiceAccountEmail,
  resolveGoogleCredentialsPath,
} from "./googleCredentials";

const SA_JSON = JSON.stringify({
  type: AI_CONFIG.CREDENTIAL_TYPE_SERVICE_ACCOUNT,
  client_email: "sa@test.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
});

describe("googleCredentials", () => {
  const envKeys = [
    AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON,
    AI_CONFIG.ENV_GOOGLE_APPLICATION_CREDENTIALS,
    AI_CONFIG.ENV_GCS_SIGNING_SERVICE_ACCOUNT,
  ] as const;

  afterEach(() => {
    for (const key of envKeys) {
      delete process.env[key];
    }
    existsSync.mockReset();
    existsSync.mockReturnValue(false);
    readFileSync.mockReset();
  });

  it("resolveGoogleCredentialsPath keeps absolute paths", () => {
    const abs = path.resolve("/tmp/creds.json");
    expect(resolveGoogleCredentialsPath(abs)).toBe(abs);
  });

  it("loadGoogleServiceAccountCredentials reads JSON from env", () => {
    process.env[AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON] = SA_JSON;
    const creds = loadGoogleServiceAccountCredentials();
    expect(creds?.[AI_CONFIG.CREDENTIAL_FIELD_CLIENT_EMAIL]).toBe("sa@test.iam.gserviceaccount.com");
  });

  it("hasGoogleCloudCredentialsEnv is true when JSON env is set", () => {
    process.env[AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON] = SA_JSON;
    expect(hasGoogleCloudCredentialsEnv()).toBe(true);
  });

  it("getVertexCredentialCacheHint uses service account email prefix", () => {
    process.env[AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON] = SA_JSON;
    const hint = getVertexCredentialCacheHint();
    expect(hint).toBe("sa@test.iam.gserviceaccount.com".slice(0, AI_CONFIG.SA_EMAIL_CACHE_HINT_LEN));
  });

  it("resolveGcsSigningServiceAccountEmail prefers env override", () => {
    process.env[AI_CONFIG.ENV_GCS_SIGNING_SERVICE_ACCOUNT] = "signer@test.iam.gserviceaccount.com";
    expect(resolveGcsSigningServiceAccountEmail()).toBe("signer@test.iam.gserviceaccount.com");
  });

  it("loadGoogleServiceAccountCredentials returns null for authorized_user JSON", () => {
    process.env[AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON] = JSON.stringify({
      type: "authorized_user",
      client_id: "cid",
      client_secret: "sec",
      refresh_token: "rt",
    });
    expect(loadGoogleServiceAccountCredentials()).toBeNull();
  });

  it("loadGoogleServiceAccountCredentials throws on invalid JSON", () => {
    process.env[AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON] = "{not-json";
    expect(() => loadGoogleServiceAccountCredentials()).toThrow(/Invalid Google credentials JSON/);
  });

  it("resolveGoogleCredentialsPath resolves relative path under cwd", () => {
    const rel = "google-credentials.json";
    existsSync.mockImplementation((p: string) => p.includes(rel));
    expect(resolveGoogleCredentialsPath(rel)).toContain(rel);
  });

  it("hasGoogleCloudCredentialsEnv is false when credentials file path missing on disk", () => {
    process.env[AI_CONFIG.ENV_GOOGLE_APPLICATION_CREDENTIALS] = "/tmp/missing-creds.json";
    existsSync.mockReturnValue(false);
    expect(hasGoogleCloudCredentialsEnv()).toBe(false);
  });

  it("loadGoogleServiceAccountCredentials reads credentials file from disk", () => {
    process.env[AI_CONFIG.ENV_GOOGLE_APPLICATION_CREDENTIALS] = "/tmp/google-credentials.json";
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue(SA_JSON);
    const creds = loadGoogleServiceAccountCredentials();
    expect(creds?.[AI_CONFIG.CREDENTIAL_FIELD_CLIENT_EMAIL]).toBe("sa@test.iam.gserviceaccount.com");
  });

  it("getVertexCredentialCacheHint falls back to ADC when credentials invalid", () => {
    process.env[AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON] = "{not-json";
    const hint = getVertexCredentialCacheHint();
    expect(hint).toBe(AI_CONFIG.ADC_CACHE_HINT);
  });

  it("resolveGoogleCredentialsPath falls back to repo root when cwd file missing", () => {
    const rel = "google-credentials.json";
    existsSync.mockImplementation((p: string) => p.includes(`${path.sep}..${path.sep}${rel}` as string));
    expect(resolveGoogleCredentialsPath(rel)).toContain(rel);
  });

  it("loadGoogleServiceAccountCredentials throws when credentials file path is missing", () => {
    process.env[AI_CONFIG.ENV_GOOGLE_APPLICATION_CREDENTIALS] = "/tmp/missing-on-disk.json";
    existsSync.mockReturnValue(false);
    expect(() => loadGoogleServiceAccountCredentials()).toThrow(/Google credentials file not found/);
  });

  it("loadGoogleServiceAccountCredentials accepts legacy service account JSON without type", () => {
    process.env[AI_CONFIG.ENV_GOOGLE_CREDENTIALS_JSON] = JSON.stringify({
      client_email: "legacy@test.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
    });
    const creds = loadGoogleServiceAccountCredentials();
    expect(creds?.[AI_CONFIG.CREDENTIAL_FIELD_CLIENT_EMAIL]).toBe("legacy@test.iam.gserviceaccount.com");
  });

  it("resolveGcsSigningServiceAccountEmail falls back to vertex default", () => {
    delete process.env[AI_CONFIG.ENV_GCS_SIGNING_SERVICE_ACCOUNT];
    expect(resolveGcsSigningServiceAccountEmail()).toBe(AI_CONFIG.VERTEX_SA_EMAIL);
  });
});
