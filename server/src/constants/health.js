/**
 * Health check and server status constants
 */
module.exports = Object.freeze({
  STATUS: {
    OK: "OK",
    UNKNOWN: "unknown",
  },
  DB: {
    CONNECTED: "connected",
    DISCONNECTED: "disconnected",
  },
  SERVICE: {
    HEALTHY: "healthy",
    UNHEALTHY: "unhealthy",
  },
  LOG: {
    DB_CONNECT_FAILED: "Failed to connect to database",
    SERVER_STARTED: "Server started successfully",
  },
  HEALTH_URL_LOCAL: (port) => `http://localhost:${port}/health`,
});
