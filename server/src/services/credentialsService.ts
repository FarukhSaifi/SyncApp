import { ERROR_MESSAGES, PLATFORMS } from "../constants";
import { NotFoundError, ValidationError } from "../middleware/errorHandler";
import Credential from "../models/Credential";
import { cache, cacheKeys } from "../utils/cache";
import { decrypt, encrypt } from "../utils/encryption";
import { createLogger } from "../utils/logger";
import { toObjectId } from "../utils/objectId";

const logger = createLogger("CREDENTIALS");

function decryptApiKey(credential: Record<string, unknown>) {
  if (!credential.api_key) return;

  try {
    credential.api_key = decrypt(credential.api_key as string);
  } catch (error) {
    logger.error(ERROR_MESSAGES.DECRYPTION_ERROR_LOG, error as Error);
    credential.api_key = "";
  }
}

/**
 * Get all credentials for a user (with decrypted API keys for settings display)
 */
export async function getAllCredentials(userId: string) {
  const cacheKey = cacheKeys.credentials.list(userId);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const credentials = (await Credential.find({ author: userId }).lean()) as unknown as Record<string, unknown>[];

  for (const credential of credentials) {
    decryptApiKey(credential);
  }

  cache.set(cacheKey, credentials, 300000);

  return credentials;
}

/**
 * Get credential by platform for a user (with decrypted API key)
 */
export async function getCredentialByPlatform(userId: string, platformName: string) {
  const credential = (await Credential.findOne({
    author: userId,
    platform_name: platformName,
  }).lean()) as Record<string, unknown> | null;

  if (!credential) {
    return null;
  }

  decryptApiKey(credential);

  return credential;
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
    throw new ValidationError(ERROR_MESSAGES.API_KEY_REQUIRED);
  }

  if (platformName === PLATFORMS.WORDPRESS && !site_url) {
    throw new ValidationError(ERROR_MESSAGES.WORDPRESS_SITE_URL_REQUIRED);
  }

  const encryptedApiKey = encrypt(api_key);
  const author = toObjectId(userId);

  const updateData: Record<string, unknown> = {
    author,
    api_key: encryptedApiKey,
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
    new: true,
    runValidators: true,
  }).lean()) as unknown as Record<string, unknown>;

  cache.delete(cacheKeys.credentials.single(userId, platformName));
  cache.delete(cacheKeys.credentials.list(userId));

  delete credential.api_key;

  return credential;
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
    throw new NotFoundError(ERROR_MESSAGES.CREDENTIAL_NOT_FOUND);
  }

  cache.delete(cacheKeys.credentials.single(userId, platformName));
  cache.delete(cacheKeys.credentials.list(userId));

  return result;
}
