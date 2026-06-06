/**
 * Database Constants
 * MongoDB connection settings, timeouts, and configuration
 */

export const DATABASE = Object.freeze({
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

  // Setup URLs
  SETUP_URLS: {
    MEDIUM_SETTINGS: "https://medium.com/me/settings",
    DEVTO_SETTINGS: "https://dev.to/settings/account",
    MONGODB_ATLAS: "https://cloud.mongodb.com/",
  },
} as const);
