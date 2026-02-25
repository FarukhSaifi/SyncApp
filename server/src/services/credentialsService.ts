import Credential from '../models/Credential';
import { encrypt, decrypt } from '../utils/encryption';
import { cache, cacheKeys } from '../utils/cache';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { ERROR_MESSAGES, PLATFORMS } from '../constants';
import { createLogger } from '../utils/logger';

const logger = createLogger('CREDENTIALS');

/**
 * Get all credentials (without decrypted API keys)
 */
export async function getAllCredentials() {
  const cacheKey = cacheKeys.credentials.list();
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const credentials = await Credential.find().lean();

  cache.set(cacheKey, credentials, 300000);

  return credentials;
}

/**
 * Get credential by platform (with decrypted API key for client display)
 */
export async function getCredentialByPlatform(platformName: string) {
  const credential = await Credential.findOne({
    platform_name: platformName,
  }).lean() as Record<string, unknown> | null;

  if (!credential) {
    return null;
  }

  if (credential.api_key) {
    try {
      credential.api_key = decrypt(credential.api_key as string);
    } catch (error) {
      logger.error(ERROR_MESSAGES.DECRYPTION_ERROR_LOG, error as Error);
      credential.api_key = '';
    }
  }

  return credential;
}

/**
 * Upsert credential (create or update)
 */
export async function upsertCredential(
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

  const updateData: Record<string, unknown> = {
    api_key: encryptedApiKey,
    is_active: true,
  };

  if (site_url) {
    updateData.site_url = site_url;
  }

  if (platform_config) {
    updateData.platform_config = platform_config;
  }

  const credential = await Credential.findOneAndUpdate({ platform_name: platformName }, updateData, {
    upsert: true,
    new: true,
    runValidators: true,
  }).lean() as unknown as Record<string, unknown>;

  cache.delete(cacheKeys.credentials.single(platformName));
  cache.delete(cacheKeys.credentials.list());

  delete credential.api_key;

  return credential;
}

/**
 * Delete credential
 */
export async function deleteCredential(platformName: string) {
  const result = await Credential.findOneAndDelete({
    platform_name: platformName,
  });

  if (!result) {
    throw new NotFoundError(ERROR_MESSAGES.CREDENTIAL_NOT_FOUND);
  }

  cache.delete(cacheKeys.credentials.single(platformName));
  cache.delete(cacheKeys.credentials.list());

  return result;
}

/**
 * Toggle credential active status
 */
export async function toggleCredentialStatus(platformName: string, isActive: boolean) {
  const credential = await Credential.findOneAndUpdate(
    { platform_name: platformName },
    { is_active: isActive },
    { new: true },
  ).lean() as unknown as Record<string, unknown> | null;

  if (!credential) {
    throw new NotFoundError(ERROR_MESSAGES.CREDENTIAL_NOT_FOUND);
  }

  cache.delete(cacheKeys.credentials.single(platformName));
  cache.delete(cacheKeys.credentials.list());

  delete credential.api_key;

  return credential;
}
