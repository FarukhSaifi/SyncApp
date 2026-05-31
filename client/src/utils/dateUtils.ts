import { APP_CONFIG, PLACEHOLDERS } from "@constants";
import dayjs from "dayjs";

/** Format an ISO date string for UI display (date + time). */
export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return PLACEHOLDERS.N_A;
  const parsed = dayjs(dateString);
  if (!parsed.isValid()) return PLACEHOLDERS.N_A;
  return parsed.format(APP_CONFIG.DATE_FORMAT_WITH_TIME);
}
