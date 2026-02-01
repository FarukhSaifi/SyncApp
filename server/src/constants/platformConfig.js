/**
 * Platform Publishing Configuration Metadata
 * Defines error messages and publish settings for each platform
 * Note: Publish functions are imported directly in controllers to avoid circular dependencies
 */

const PLATFORM_CONFIG = {
  medium: {
    name: "Medium",
    errorMessage: "Medium API credentials not found. Please configure your Medium API key in settings.",
    publishStatus: "public",
    contentFormat: "markdown",
  },
  devto: {
    name: "DEV.to",
    errorMessage: "DEV.to API credentials not found. Please configure your DEV.to API key in settings.",
    published: true,
  },
  wordpress: {
    name: "WordPress",
    errorMessage: "WordPress API credentials not found. Please configure your WordPress API key in settings.",
    status: "publish",
  },
};

module.exports = {
  PLATFORM_CONFIG,
};
