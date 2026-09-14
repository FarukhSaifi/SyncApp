/**
 * Common cross-cutting server types.
 */
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import type { NotificationChannelStatus } from "../constants/notifications";

export interface ILogger {
  error(message: string, error?: Error | null, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  request(req: ExpressRequest, res: ExpressResponse, duration: number): void;
  query(operation: string, model: string, duration: number, meta?: Record<string, unknown>): void;
  externalApi(
    service: string,
    endpoint: string,
    duration: number,
    status: number | string,
    meta?: Record<string, unknown>,
  ): void;
  cache(operation: string, key: string, hit?: boolean | null): void;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export interface NotificationResult {
  slack: NotificationChannelStatus;
  email: NotificationChannelStatus;
}

export interface NormalizeScheduledForOptions {
  currentStatus?: string;
  requireFuture?: boolean;
}
