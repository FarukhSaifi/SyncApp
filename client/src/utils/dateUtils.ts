import { APP_CONFIG, PLACEHOLDERS, SYNC_LABEL } from "@constants";
import dayjs from "dayjs";

/** Format an ISO date string for UI display (date + time). */
export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return PLACEHOLDERS.N_A;
  const parsed = dayjs(dateString);
  if (!parsed.isValid()) return PLACEHOLDERS.N_A;
  return parsed.format(APP_CONFIG.DATE_FORMAT_WITH_TIME);
}

/** Format last login; shows a friendly label when the user has never signed in. */
export function formatLastLogin(dateString?: string | null): string {
  if (!dateString) return SYNC_LABEL.NEVER_LOGGED_IN;
  const parsed = dayjs(dateString);
  if (!parsed.isValid()) return SYNC_LABEL.NEVER_LOGGED_IN;
  return parsed.format(APP_CONFIG.DATE_FORMAT_WITH_TIME);
}
