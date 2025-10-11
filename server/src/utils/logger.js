/**
 * Centralized logging utility
 * Provides consistent logging across the application
 */

const { config } = require("../config");

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

class Logger {
  constructor(context = "APP") {
    this.context = context;
    this.isDevelopment = config.nodeEnv === "development";
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
   * Log error
   */
  error(message, error = null, meta = {}) {
    const logMeta = { ...meta };

    if (error) {
      logMeta.error = {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        ...error,
      };
    }

    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, logMeta));
  }

  /**
   * Log warning
   */
  warn(message, meta = {}) {
    console.warn(this.formatMessage(LOG_LEVELS.WARN, message, meta));
  }

  /**
   * Log info
   */
  info(message, meta = {}) {
    console.log(this.formatMessage(LOG_LEVELS.INFO, message, meta));
  }

  /**
   * Log debug (only in development)
   */
  debug(message, meta = {}) {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  /**
   * Log HTTP request
   */
  request(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };

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

