const service = require("../services/credentialsService");

async function list(req, res) {
  try {
    const data = await service.getAllCredentials();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function get(req, res) {
  try {
    const data = await service.getCredentialByPlatform(req.params.platform);
    if (!data) return res.status(404).json({ success: false, error: "Credentials not found for this platform" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function upsert(req, res) {
  try {
    const data = await service.upsertCredential(req.params.platform, req.body);
    res.json({ success: true, data, message: "Credentials saved successfully" });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, error: error.message });
  }
}

async function remove(req, res) {
  try {
    await service.deleteCredential(req.params.platform);
    res.json({ success: true, message: "Credentials deleted successfully" });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, error: error.message });
  }
}

module.exports = { list, get, upsert, remove };
