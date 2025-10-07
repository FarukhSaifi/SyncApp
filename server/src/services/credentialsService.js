const Credential = require("../models/Credential");
const { encrypt } = require("../utils/encryption");

async function listCredentials() {
  return Credential.find().sort({ platform_name: 1 });
}

async function getCredential(platform) {
  return Credential.findOne({ platform_name: platform });
}

async function upsertCredential(platform, { api_key, site_url, platform_config }) {
  if (!api_key) {
    const err = new Error("API key is required");
    err.status = 400;
    throw err;
  }
  const encryptedApiKey = encrypt(api_key);
  const existing = await getCredential(platform);

  if (existing) {
    const updateData = { api_key: encryptedApiKey, is_active: true };
    if (platform === "wordpress" && site_url) updateData.site_url = site_url;
    if (platform_config) updateData.platform_config = platform_config;

    return Credential.findByIdAndUpdate(existing._id, updateData, { new: true, runValidators: true });
  }

  const createData = { platform_name: platform, api_key: encryptedApiKey, user_id: 1, is_active: true };
  if (platform === "wordpress" && site_url) createData.site_url = site_url;
  if (platform_config) createData.platform_config = platform_config;
  return Credential.create(createData);
}

async function deleteCredential(platform) {
  const deleted = await Credential.findOneAndDelete({ platform_name: platform });
  if (!deleted) {
    const err = new Error("Credentials not found for this platform");
    err.status = 404;
    throw err;
  }
  return deleted;
}

module.exports = { listCredentials, getCredential, upsertCredential, deleteCredential };
