/**
 * Platform Publishing Configuration Metadata
 * Defines error messages and publish settings for each platform
 * Note: Publish functions are imported directly in controllers to avoid circular dependencies
 */

export const PLATFORM_CONFIG = Object.freeze({
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
    maxTags: 4,
  },
  wordpress: {
    name: "WordPress",
    errorMessage: "WordPress API credentials not found. Please configure your WordPress API key in settings.",
    status: "publish",
  },
  linkedin: {
    name: "LinkedIn",
    errorMessage: "LinkedIn is not connected. Connect LinkedIn in Settings to publish the summary.",
  },
} as const);
