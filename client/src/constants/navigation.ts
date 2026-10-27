/**
 * Client navigation / leave-guard tokens.
 */

/** History state flag for the unsaved-leave guard entry. */
export const UNSAVED_LEAVE_GUARD = Object.freeze({
  STATE_KEY: "__unsavedLeaveGuard",
  /** Soft-nav / Strict Mode can leave extra same-URL history entries; cap back steps. */
  MAX_HISTORY_STEPS: 5,
} as const);
