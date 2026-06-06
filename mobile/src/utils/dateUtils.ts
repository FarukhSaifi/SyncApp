import dayjs from "dayjs";

import { APP_CONFIG } from "@/src/constants/config";
import { LABELS } from "@/src/constants/messages";

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return "—";
  const parsed = dayjs(dateString);
  if (!parsed.isValid()) return "—";
  return parsed.format(APP_CONFIG.DATE_FORMAT_WITH_TIME);
}

export function formatLastLogin(dateString?: string | null): string {
  if (!dateString) return LABELS.NEVER;
  const parsed = dayjs(dateString);
  if (!parsed.isValid()) return LABELS.NEVER;
  return parsed.format(APP_CONFIG.DATE_FORMAT_WITH_TIME);
}
