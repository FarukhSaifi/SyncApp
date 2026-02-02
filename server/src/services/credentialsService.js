const Credential = require("../models/Credential");
const { encrypt, decrypt } = require("../utils/encryption");
const { cache, cacheKeys } = require("../utils/cache");
const { NotFoundError, ValidationError } = require("../middleware/errorHandler");
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require("../constants");
const { createLogger } = require("../utils/logger");

const logger = createLogger("CREDENTIALS");

/**
 * Get all credentials (without decrypted API keys)
 */
async function getAllCredentials() {
  // Try cache first
  const cacheKey = cacheKeys.credentials.list();
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const credentials = await Credential.find().lean();

  // Cache for 5 minutes
  cache.set(cacheKey, credentials, 300000);

  return credentials;
}

/**
 * Get credential by platform (with decrypted API key for client display)
 */
async function getCredentialByPlatform(platformName) {
  const credential = await Credential.findOne({
    platform_name: platformName,
  }).lean();

  if (!credential) {
    return null;
  }

  // Decrypt the API key for client display
  if (credential.api_key) {
    try {
      credential.api_key = decrypt(credential.api_key);
    } catch (error) {
      logger.error(ERROR_MESSAGES.DECRYPTION_ERROR_LOG, error);
      credential.api_key = "";
    }
  }

  return credential;
}

/**
 * Upsert credential (create or update)
 */
async function upsertCredential(platformName, data) {
  const { api_key, site_url, platform_config } = data;

  if (!api_key) {
    throw new ValidationError("API key is required");
  }

  // Validate platform-specific requirements
  if (platformName === "wordpress" && !site_url) {
    throw new ValidationError("WordPress site URL is required");
  }

  // Encrypt API key
  const encryptedApiKey = encrypt(api_key);

  // Prepare update data
  const updateData = {
    api_key: encryptedApiKey,
    is_active: true,
  };

  if (site_url) {
    updateData.site_url = site_url;
  }

  if (platform_config) {
    updateData.platform_config = platform_config;
  }

  // Upsert credential
  const credential = await Credential.findOneAndUpdate({ platform_name: platformName }, updateData, {
    upsert: true,
    new: true,
    runValidators: true,
  }).lean();

  // Invalidate cache
  cache.delete(cacheKeys.credentials.single(platformName));
  cache.delete(cacheKeys.credentials.list());

  // Remove API key from response
  delete credential.api_key;

  return credential;
}

/**
 * Delete credential
 */
async function deleteCredential(platformName) {
  const result = await Credential.findOneAndDelete({
    platform_name: platformName,
  });

  if (!result) {
    throw new NotFoundError(ERROR_MESSAGES.CREDENTIAL_NOT_FOUND);
  }

  // Invalidate cache
  cache.delete(cacheKeys.credentials.single(platformName));
  cache.delete(cacheKeys.credentials.list());

  return result;
}

/**
 * Toggle credential active status
 */
async function toggleCredentialStatus(platformName, isActive) {
  const credential = await Credential.findOneAndUpdate(
    { platform_name: platformName },
    { is_active: isActive },
    { new: true }
  ).lean();

  if (!credential) {
    throw new NotFoundError(ERROR_MESSAGES.CREDENTIAL_NOT_FOUND);
  }

  // Invalidate cache
  cache.delete(cacheKeys.credentials.single(platformName));
  cache.delete(cacheKeys.credentials.list());

  // Remove API key from response
  delete credential.api_key;

  return credential;
}

module.exports = {
  getAllCredentials,
  getCredentialByPlatform,
  upsertCredential,
  deleteCredential,
  toggleCredentialStatus,
};
