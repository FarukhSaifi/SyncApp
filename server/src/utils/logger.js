/**
 * Centralized logging utility.
 * Development: full logs including debug, stacks, and meta.
 * Production: no sensitive data (redacted keys, no stacks, safe request meta).
 */

const { config } = require("../config");
const { SENSITIVE_KEYS, REDACT_PLACEHOLDER } = require("../constants/logging");

const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

const COLORS = {
  ERROR: "\x1b[31m", // Red
  WARN: "\x1b[33m", // Yellow
  INFO: "\x1b[36m", // Cyan
  DEBUG: "\x1b[35m", // Magenta
  RESET: "\x1b[0m",
};

function redactSensitive(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitive);

  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((k) => keyLower.includes(k.toLowerCase()));
    if (isSensitive) {
      out[key] = REDACT_PLACEHOLDER;
    } else {
      out[key] = typeof value === "object" && value !== null ? redactSensitive(value) : value;
    }
  }
  return out;
}

class Logger {
  constructor(context = "APP") {
    this.context = context;
    this.isDevelopment = config.nodeEnv === "development";
  }

  /** Return meta safe for the current environment (redact in production) */
  safeMeta(meta = {}) {
    return this.isDevelopment ? meta : redactSensitive(meta);
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const color = COLORS[level] || COLORS.RESET;
    const reset = COLORS.RESET;

    const base = `${color}[${timestamp}] [${level}] [${this.context}]${reset} ${message}`;

    if (Object.keys(meta).length > 0) {
      return `${base}\n${JSON.stringify(meta, null, 2)}`;
    }

    return base;
  }

  /**
   * Log error. In production: message only, no stack or error details.
   */
  error(message, error = null, meta = {}) {
    const logMeta = this.safeMeta(meta);

    if (error) {
      logMeta.error = this.isDevelopment
        ? { message: error.message, stack: error.stack, ...error }
        : { message: error.message };
    }

    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, logMeta));
  }

  /**
   * Log warning
   */
  warn(message, meta = {}) {
    console.warn(this.formatMessage(LOG_LEVELS.WARN, message, this.safeMeta(meta)));
  }

  /**
   * Log info
   */
  info(message, meta = {}) {
    console.log(this.formatMessage(LOG_LEVELS.INFO, message, this.safeMeta(meta)));
  }

  /**
   * Log debug (development only; no-op in production)
   */
  debug(message, meta = {}) {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  /**
   * Log HTTP request. In production: url/userAgent redacted if sensitive.
   */
  request(req, res, duration) {
    const rawMeta = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };
    const meta = this.safeMeta(rawMeta);
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

    if (res.statusCode >= 500) {
      this.error(message, null, meta);
    } else if (res.statusCode >= 400) {
      this.warn(message, meta);
    } else {
      this.info(message, meta);
    }
  }

  /**
   * Log database query
   */
  query(operation, model, duration, meta = {}) {
    this.debug(`DB ${operation} on ${model}`, {
      operation,
      model,
      duration: `${duration}ms`,
      ...meta,
    });
  }

  /**
   * Log external API call
   */
  externalApi(service, endpoint, duration, status, meta = {}) {
    this.info(`External API: ${service} ${endpoint}`, {
      service,
      endpoint,
      status,
      duration: `${duration}ms`,
      ...meta,
    });
  }

  /**
   * Log cache operation
   */
  cache(operation, key, hit = null) {
    this.debug(`Cache ${operation}`, {
      operation,
      key,
      hit: hit !== null ? (hit ? "HIT" : "MISS") : undefined,
    });
  }
}

// Create logger instances for different contexts
const createLogger = (context) => new Logger(context);

// Default logger
const logger = new Logger("APP");

// Request logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.request(req, res, duration);
  });

  next();
}

module.exports = {
  logger,
  createLogger,
  requestLogger,
  Logger,
};
