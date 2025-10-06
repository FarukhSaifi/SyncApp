const express = require("express");
const Credential = require("../models/Credential");
const { encrypt, decrypt } = require("../utils/encryption");

const router = express.Router();

// GET /api/credentials - Get all credentials (for admin purposes)
router.get("/", async (req, res) => {
  try {
    const credentials = await Credential.find().sort({ platform_name: 1 });

    res.json({
      success: true,
      data: credentials,
    });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch credentials",
    });
  }
});

// GET /api/credentials/:platform - Get credentials for a specific platform
router.get("/:platform", async (req, res) => {
  try {
    const { platform } = req.params;

    const credential = await Credential.findOne({ platform_name: platform });

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: "Credentials not found for this platform",
      });
    }

    res.json({
      success: true,
      data: credential,
    });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch credentials",
    });
  }
});

// PUT /api/credentials/:platform - Save or update credentials for a platform
router.put("/:platform", async (req, res) => {
  try {
    const { platform } = req.params;
    const { api_key, site_url, platform_config } = req.body;

    if (!api_key) {
      return res.status(400).json({
        success: false,
        error: "API key is required",
      });
    }

    // Encrypt the API key before storing
    const encryptedApiKey = encrypt(api_key);

    // Check if credentials already exist for this platform
    const existingCredential = await Credential.findOne({ platform_name: platform });

    let credential;
    if (existingCredential) {
      // Update existing credentials
      const updateData = {
        api_key: encryptedApiKey,
        is_active: true,
      };

      // Add platform-specific data
      if (platform === "wordpress" && site_url) {
        updateData.site_url = site_url;
      }
      if (platform_config) {
        updateData.platform_config = platform_config;
      }

      credential = await Credential.findByIdAndUpdate(existingCredential._id, updateData, {
        new: true,
        runValidators: true,
      });
    } else {
      // Insert new credentials
      const credentialData = {
        platform_name: platform,
        api_key: encryptedApiKey,
        user_id: 1,
        is_active: true,
      };

      // Add platform-specific data
      if (platform === "wordpress" && site_url) {
        credentialData.site_url = site_url;
      }
      if (platform_config) {
        credentialData.platform_config = platform_config;
      }

      credential = await Credential.create(credentialData);
    }

    res.json({
      success: true,
      data: credential,
      message: existingCredential ? "Credentials updated successfully" : "Credentials saved successfully",
    });
  } catch (error) {
    console.error("Error saving credentials:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save credentials",
    });
  }
});

// DELETE /api/credentials/:platform - Delete credentials for a platform
router.delete("/:platform", async (req, res) => {
  try {
    const { platform } = req.params;

    const credential = await Credential.findOneAndDelete({ platform_name: platform });

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: "Credentials not found for this platform",
      });
    }

    res.json({
      success: true,
      message: "Credentials deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting credentials:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete credentials",
    });
  }
});

module.exports = router;
