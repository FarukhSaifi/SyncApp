
import { POST_STATUS, VALID_SCHEDULE_PLATFORMS, type SchedulePlatform } from "@constants";
import { ValidationError } from "@middleware/errorHandler";
import type { NormalizeScheduledForOptions } from "@types";
import dayjs from "dayjs";

import { VALIDATION_ERRORS } from "@constants/validation";

/**
 * Normalize scheduled_for for create/update.
 * - empty string / null / undefined → null
 * - invalid date → ValidationError
 * - optional requireFuture → must be after now
 * - published posts cannot be scheduled
 */
export function normalizeScheduledFor(value: unknown, options: NormalizeScheduledForOptions = {}): Date | null {
  const { currentStatus, requireFuture = true } = options;

  if (value === null || value === "") {
    return null;
  }

  if (currentStatus === POST_STATUS.PUBLISHED) {
    throw new ValidationError(VALIDATION_ERRORS.SCHEDULE_NOT_ALLOWED_PUBLISHED);
  }

  const parsed = dayjs(value as string | Date);
  if (!parsed.isValid()) {
    throw new ValidationError(VALIDATION_ERRORS.SCHEDULE_INVALID_DATE);
  }

  if (requireFuture && !parsed.isAfter(dayjs())) {
    throw new ValidationError(VALIDATION_ERRORS.SCHEDULE_MUST_BE_FUTURE);
  }

  return parsed.toDate();
}

/**
 * Normalize scheduled_platforms for create/update.
 * - null / undefined / empty → []
 * - unknown slugs stripped; duplicates removed
 * - when a future schedule is set, at least one valid platform is required
 */
export function normalizeScheduledPlatforms(
  value: unknown,
  options: { scheduledFor: Date | null } = { scheduledFor: null },
): SchedulePlatform[] {
  if (value === null || value === undefined) {
    if (options.scheduledFor) {
      throw new ValidationError(VALIDATION_ERRORS.SCHEDULE_PLATFORMS_REQUIRED);
    }
    return [];
  }

  if (!Array.isArray(value)) {
    throw new ValidationError(VALIDATION_ERRORS.SCHEDULE_PLATFORMS_INVALID);
  }

  const allowed = new Set<string>(VALID_SCHEDULE_PLATFORMS);
  const unique: SchedulePlatform[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }
    const slug = entry.trim().toLowerCase();
    if (!allowed.has(slug)) {
      continue;
    }
    if (!unique.includes(slug as SchedulePlatform)) {
      unique.push(slug as SchedulePlatform);
    }
  }

  if (options.scheduledFor && unique.length === 0) {
    throw new ValidationError(VALIDATION_ERRORS.SCHEDULE_PLATFORMS_REQUIRED);
  }

  return unique;
}

/** Mongo filter for drafts due for the daily publish cron. */
export function scheduledPublishDueFilter(now: Date = dayjs().toDate()) {
  return {
    status: POST_STATUS.DRAFT,
    scheduled_for: { $exists: true, $ne: null, $lte: now },
  };
}
