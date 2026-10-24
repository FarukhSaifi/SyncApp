import { LABELS } from "@constants/messages";
import type { StatusTone, ThemeColors } from "../types/theme";

export type { StatusTone } from "../types/theme";

export const POST_STATUS = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const);

export const FILTER_STATUS_ALL = "all";

/** Display config — labels from messages.ts */
export const STATUS_CONFIG = Object.freeze({
  [POST_STATUS.DRAFT]: { label: LABELS.STATUS_DRAFT, tone: "muted" as const },
  [POST_STATUS.PUBLISHED]: { label: LABELS.STATUS_PUBLISHED, tone: "positive" as const },
  [POST_STATUS.ARCHIVED]: { label: LABELS.STATUS_ARCHIVED, tone: "warning" as const },
});

export function getStatusLabel(status: string): string {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  return cfg?.label ?? status;
}

export function getStatusBadgeStyle(colors: ThemeColors, tone: StatusTone) {
  switch (tone) {
    case "positive":
      return { backgroundColor: `${colors.positive}26`, color: colors.positive };
    case "warning":
      return { backgroundColor: `${colors.warning}26`, color: colors.warning };
    default:
      return { backgroundColor: colors.muted, color: colors.mutedForeground };
  }
}
