import dayjs from "dayjs";

import { POST_STATUS } from "../constants";
import { VALIDATION_ERRORS } from "../constants/validation";
import { ValidationError } from "../middleware/errorHandler";
import type { NormalizeScheduledForOptions } from "../types";

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

/** Mongo filter for drafts due for the daily publish cron. */
export function scheduledPublishDueFilter(now: Date = dayjs().toDate()) {
  return {
    status: POST_STATUS.DRAFT,
    scheduled_for: { $exists: true, $ne: null, $lte: now },
  };
}
