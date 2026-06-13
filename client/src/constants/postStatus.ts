import { LABELS } from "./messages";

/**
 * Post status values and display config.
 */
export const POST_STATUS = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const);

export type PostStatusValue = (typeof POST_STATUS)[keyof typeof POST_STATUS];

/** Dashboard filter value for "all" (no status filter) */
export const FILTER_STATUS_ALL = "all";

export const SCHEDULED_STATUS_CLASS = "bg-primary/15 text-primary";

export const STATUS_CONFIG = Object.freeze({
  [POST_STATUS.DRAFT]: { label: LABELS.POST_STATUS_DRAFT, className: "bg-muted text-muted-foreground" },
  [POST_STATUS.PUBLISHED]: { label: LABELS.POST_STATUS_PUBLISHED, className: "bg-positive/15 text-positive" },
  [POST_STATUS.ARCHIVED]: { label: LABELS.POST_STATUS_ARCHIVED, className: "bg-warning/15 text-warning" },
} as const);
