const Credential = require("../models/Credential");
const { encrypt, decrypt } = require("../utils/encryption");
const { cache, cacheKeys } = require("../utils/cache");
const { NotFoundError, ValidationError } = require("../middleware/errorHandler");

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

  const credentials = await Credential.find()
    .select("-api_key") // Don't send API keys to client
    .lean();

  // Cache for 5 minutes
  cache.set(cacheKey, credentials, 300000);

  return credentials;
}

/**
 * Get credential by platform (with decrypted API key for internal use)
 */
async function getCredentialByPlatform(platformName, decrypt = false) {
  // Try cache first (only for non-decrypted requests)
  if (!decrypt) {
    const cacheKey = cacheKeys.credentials.single(platformName);
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const credential = await Credential.findOne({ platform_name: platformName }).lean();

  if (!credential) {
    return null;
  }

  // Cache for 5 minutes (without decryption)
  if (!decrypt) {
    const cacheKey = cacheKeys.credentials.single(platformName);
    cache.set(cacheKey, credential, 300000);
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
  const credential = await Credential.findOneAndUpdate(
    { platform_name: platformName },
    updateData,
    { upsert: true, new: true, runValidators: true }
  ).lean();

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
  const result = await Credential.findOneAndDelete({ platform_name: platformName });

  if (!result) {
    throw new NotFoundError("Credential not found");
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
    throw new NotFoundError("Credential not found");
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
