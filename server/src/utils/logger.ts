/**
 * Centralized logging utility.
 * Development: full logs including debug, stacks, and meta.
 * Production: no sensitive data (redacted keys, no stacks, safe request meta).
 */

import { config } from '../config';
import { DEFAULT_VALUES } from '../constants/defaultValues';
import { SENSITIVE_KEYS, REDACT_PLACEHOLDER } from '../constants/logging';
import type { Request, Response, NextFunction } from 'express';

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const COLORS: Record<LogLevel | 'RESET', string> = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[35m', // Magenta
  RESET: '\x1b[0m',
};

function redactSensitive(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitive);

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const keyLower = key.toLowerCase();
    const isSensitive = (SENSITIVE_KEYS as unknown as string[]).some((k: string) => keyLower.includes(k.toLowerCase()));
    if (isSensitive) {
      out[key] = REDACT_PLACEHOLDER;
    } else {
      out[key] = typeof value === 'object' && value !== null ? redactSensitive(value) : value;
    }
  }
  return out;
}

export interface ILogger {
  error(message: string, error?: Error | null, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  request(req: Request, res: Response, duration: number): void;
  query(operation: string, model: string, duration: number, meta?: Record<string, unknown>): void;
  externalApi(service: string, endpoint: string, duration: number, status: number | string, meta?: Record<string, unknown>): void;
  cache(operation: string, key: string, hit?: boolean | null): void;
}

export class Logger implements ILogger {
  private context: string;
  private isDevelopment: boolean;

  constructor(context = 'APP') {
    this.context = context;
    this.isDevelopment = config.nodeEnv === DEFAULT_VALUES.NODE_ENV_DEVELOPMENT;
  }

  /** Return meta safe for the current environment (redact in production) */
  safeMeta(meta: Record<string, unknown> = {}): Record<string, unknown> {
    return this.isDevelopment ? meta : (redactSensitive(meta) as Record<string, unknown>);
  }

  formatMessage(level: LogLevel, message: string, meta: Record<string, unknown> = {}): string {
    const timestamp = new Date().toISOString();
    const color = COLORS[level] ?? COLORS.RESET;
    const reset = COLORS.RESET;

    const base = `${color}[${timestamp}] [${level}] [${this.context}]${reset} ${message}`;

    if (Object.keys(meta).length > 0) {
      return `${base}\n${JSON.stringify(meta, null, 2)}`;
    }

    return base;
  }

  /** Log error. In production: message only, no stack or error details. */
  error(message: string, error: Error | null = null, meta: Record<string, unknown> = {}): void {
    const logMeta = this.safeMeta(meta);

    if (error) {
      logMeta['error'] = this.isDevelopment
        ? { message: error.message, stack: error.stack, ...(error as unknown as Record<string, unknown>) }
        : { message: error.message };
    }

    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, logMeta));
  }

  warn(message: string, meta: Record<string, unknown> = {}): void {
    console.warn(this.formatMessage(LOG_LEVELS.WARN, message, this.safeMeta(meta)));
  }

  info(message: string, meta: Record<string, unknown> = {}): void {
    console.log(this.formatMessage(LOG_LEVELS.INFO, message, this.safeMeta(meta)));
  }

  /** Log debug (development only; no-op in production) */
  debug(message: string, meta: Record<string, unknown> = {}): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  /** Log HTTP request. In production: url/userAgent redacted if sensitive. */
  request(req: Request, res: Response, duration: number): void {
    const rawMeta = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
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

  query(operation: string, model: string, duration: number, meta: Record<string, unknown> = {}): void {
    this.debug(`DB ${operation} on ${model}`, {
      operation,
      model,
      duration: `${duration}ms`,
      ...meta,
    });
  }

  externalApi(service: string, endpoint: string, duration: number, status: number | string, meta: Record<string, unknown> = {}): void {
    this.info(`External API: ${service} ${endpoint}`, {
      service,
      endpoint,
      status,
      duration: `${duration}ms`,
      ...meta,
    });
  }

  cache(operation: string, key: string, hit: boolean | null = null): void {
    this.debug(`Cache ${operation}`, {
      operation,
      key,
      hit: hit !== null ? (hit ? 'HIT' : 'MISS') : undefined,
    });
  }
}

export const createLogger = (context: string): Logger => new Logger(context);

export const logger = new Logger('APP');

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req, res, duration);
  });

  next();
}
