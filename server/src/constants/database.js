/**
 * Database Constants
 * MongoDB connection settings, timeouts, and configuration
 */

module.exports = Object.freeze({
  // Connection timeouts (milliseconds)
  SERVER_SELECTION_TIMEOUT: 5000, // 5 seconds
  SOCKET_TIMEOUT: 45000, // 45 seconds

  // Connection states
  MONGOOSE_STATE: {
    DISCONNECTED: 0,
    CONNECTED: 1,
    CONNECTING: 2,
    DISCONNECTING: 3,
  },

  // Default credentials
  DEFAULT_PLATFORM_CREDENTIALS: {
    MEDIUM: {
      platform_name: "medium",
      api_key: "your_medium_api_key_here",
      user_id: 1,
      is_active: false,
    },
    DEVTO: {
      platform_name: "devto",
      api_key: "your_devto_api_key_here",
      user_id: 1,
      is_active: false,
      platform_config: {
        devto_username: "your_devto_username_here",
      },
    },
  },

  // Setup URLs
  SETUP_URLS: {
    MEDIUM_SETTINGS: "https://medium.com/me/settings",
    DEVTO_SETTINGS: "https://dev.to/settings/account",
    MONGODB_ATLAS: "https://cloud.mongodb.com/",
  },
});
