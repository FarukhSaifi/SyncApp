const service = require("../services/credentialsService");
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require("../constants");

async function list(req, res) {
  try {
    const data = await service.getAllCredentials();
    res.json({ success: true, data });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
}

async function get(req, res) {
  try {
    const data = await service.getCredentialByPlatform(req.params.platform);
    if (!data) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: ERROR_MESSAGES.CREDENTIALS_NOT_FOUND_PLATFORM });
    res.json({ success: true, data });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
}

async function upsert(req, res) {
  try {
    const data = await service.upsertCredential(req.params.platform, req.body);
    res.json({ success: true, data, message: SUCCESS_MESSAGES.CREDENTIALS_SAVED });
  } catch (error) {
    const status = error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    res.status(status).json({ success: false, error: error.message });
  }
}

async function remove(req, res) {
  try {
    await service.deleteCredential(req.params.platform);
    res.json({ success: true, message: SUCCESS_MESSAGES.CREDENTIALS_DELETED });
  } catch (error) {
    const status = error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    res.status(status).json({ success: false, error: error.message });
  }
}

module.exports = { list, get, upsert, remove };
