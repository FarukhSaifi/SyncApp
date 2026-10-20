import { DEFAULT_VALUES, ERROR_MESSAGES, PLATFORMS } from "@constants";
import { NotFoundError, ValidationError } from "@middleware/errorHandler";
import Credential from "@models/Credential";
import { cache, cacheKeys } from "@utils/cache";
import { decryptCredential, encryptCredential } from "@utils/encryption";
import { createLogger } from "@utils/logger";
import { toObjectId } from "@utils/objectId";

const logger = createLogger("CREDENTIALS");

function maskApiKey(plaintext: string): { api_key_last4: string; api_key_masked: string } {
  const trimmed = plaintext.trim();
  const visible = DEFAULT_VALUES["CREDENTIAL_API_KEY_VISIBLE_CHARS"];
  const last4 = trimmed.length >= visible ? trimmed.slice(-visible) : trimmed;
  return {
    api_key_last4: last4,
    api_key_masked: last4 ? `${DEFAULT_VALUES["CREDENTIAL_API_KEY_MASK_PREFIX"]}${last4}` : "",
  };
}

/**
 * Shape returned to clients: never include full decrypted platform API keys.
 * LinkedIn OAuth tokens stay stripped (person URN only).
 */
function sanitizeCredentialForClient(credential: Record<string, unknown>): Record<string, unknown> {
  const platformName = credential.platform_name;

  if (platformName === PLATFORMS["LINKEDIN"]) {
    const hasToken = Boolean(credential.encrypted_payload || credential.api_key);
    const hasRefresh = Boolean(credential.refresh_token);
    const expiresAtRaw = credential.token_expires_at;
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw as string | Date).getTime() : NaN;
    const tokenExpired = Number.isFinite(expiresAt) && expiresAt < Date.now();

    delete credential.api_key;
    delete credential.encrypted_payload;
    delete credential.refresh_token;

    let personUrn: unknown;
    if (credential.platform_config && typeof credential.platform_config === "object") {
      const cfg = { ...(credential.platform_config as Record<string, unknown>) };
      personUrn = cfg.linkedin_person_urn;
      credential.platform_config = {
        linkedin_person_urn: personUrn,
      };
    }

    // Usable only with member URN + stored token, and either still valid or refreshable.
    const canRefresh = hasRefresh;
    credential.configured = Boolean(personUrn) && hasToken && (!tokenExpired || canRefresh);
    if (tokenExpired && !canRefresh) {
      credential.token_expired = true;
    }
    return credential;
  }

  const encrypted = (credential.encrypted_payload || credential.api_key) as string | undefined;
  delete credential.api_key;
  delete credential.encrypted_payload;
  delete credential.refresh_token;

  let configured = Boolean(encrypted);
  let decryptFailed = false;

  if (encrypted) {
    try {
      const decrypted = decryptCredential(encrypted);
      if (decrypted) {
        Object.assign(credential, maskApiKey(decrypted));
        configured = true;
      } else {
        configured = false;
      }
    } catch (error) {
      logger.error(ERROR_MESSAGES["DECRYPTION_ERROR_LOG"], error as Error);
      // Unreadable ciphertext must not look "connected" — force re-entry in Settings.
      decryptFailed = true;
      configured = false;
    }
  }

  credential.configured = configured;
  if (decryptFailed) {
    credential.decrypt_failed = true;
  }

  return credential;
}

/**
 * Get all credentials for a user (masked keys only — never full decrypted secrets).
 */
export async function getAllCredentials(userId: string) {
  const cacheKey = cacheKeys.credentials.list(userId);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const credentials = (await Credential.find({ author: userId }).lean()) as unknown as Record<string, unknown>[];

  for (const credential of credentials) {
    sanitizeCredentialForClient(credential);
  }

  cache.set(cacheKey, credentials, DEFAULT_VALUES["CACHE_TTL_DEFAULT_MS"]);

  return credentials;
}

/**
 * Get credential by platform for a user (masked — never full decrypted API key).
 */
export async function getCredentialByPlatform(userId: string, platformName: string) {
  const credential = (await Credential.findOne({
    author: userId,
    platform_name: platformName,
  }).lean()) as Record<string, unknown> | null;

  if (!credential) {
    return null;
  }

  return sanitizeCredentialForClient(credential);
}

/**
 * Upsert credential (create or update) for a user
 */
export async function upsertCredential(
  userId: string,
  platformName: string,
  data: { api_key?: string; site_url?: string; platform_config?: Record<string, unknown> },
) {
  const { api_key, site_url, platform_config } = data;

  if (!api_key) {
    throw new ValidationError(ERROR_MESSAGES["API_KEY_REQUIRED"]);
  }

  if (platformName === PLATFORMS["LINKEDIN"]) {
    throw new ValidationError(ERROR_MESSAGES["LINKEDIN_API_KEY_PASTE_UNSUPPORTED"]);
  }

  if (platformName === PLATFORMS["WORDPRESS"] && !site_url) {
    throw new ValidationError(ERROR_MESSAGES["WORDPRESS_SITE_URL_REQUIRED"]);
  }

  const encryptedApiKey = encryptCredential(api_key);
  const author = toObjectId(userId);

  const updateData: Record<string, unknown> = {
    author,
    api_key: encryptedApiKey,
    encrypted_payload: encryptedApiKey,
    is_active: true,
  };

  if (site_url) {
    updateData.site_url = site_url;
  }

  if (platform_config) {
    updateData.platform_config = platform_config;
  }

  const credential = (await Credential.findOneAndUpdate({ author, platform_name: platformName }, updateData, {
    upsert: true,
    returnDocument: "after",
    runValidators: true,
  }).lean()) as unknown as Record<string, unknown>;

  cache.delete(cacheKeys.credentials.single(userId, platformName));
  cache.delete(cacheKeys.credentials.list(userId));

  return sanitizeCredentialForClient(credential);
}

/**
 * Delete credential for a user
 */
export async function deleteCredential(userId: string, platformName: string) {
  const result = await Credential.findOneAndDelete({
    author: userId,
    platform_name: platformName,
  });

  if (!result) {
    throw new NotFoundError(ERROR_MESSAGES["CREDENTIAL_NOT_FOUND"]);
  }

  cache.delete(cacheKeys.credentials.single(userId, platformName));
  cache.delete(cacheKeys.credentials.list(userId));

  return result;
}
