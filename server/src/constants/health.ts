/**
 * Health check and server status constants
 */

export const HEALTH_STATUS = Object.freeze({
  OK: "OK ✅",
  UNKNOWN: "unknown ❌",
} as const);

export const HEALTH_DB = Object.freeze({
  CONNECTED: "connected ✅",
  DISCONNECTED: "disconnected ❌",
} as const);

export const HEALTH_SERVICE = Object.freeze({
  HEALTHY: "healthy ✅",
  UNHEALTHY: "unhealthy ⚠️",
} as const);

export const HEALTH_LOG = Object.freeze({
  DB_CONNECT_FAILED: "Failed to connect to database ❌",
  SERVER_STARTED: "Server started successfully ✅",
} as const);

export const HEALTH_URL_LOCAL = (port: number) => `http://localhost:${port}/health`;

export const HEALTH = {
  STATUS: HEALTH_STATUS,
  DB: HEALTH_DB,
  SERVICE: HEALTH_SERVICE,
  LOG: HEALTH_LOG,
  HEALTH_URL_LOCAL,
};
