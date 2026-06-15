import type { PostStatusDisplay } from "@types";
import dayjs from "dayjs";

import { LABELS } from "@constants/messages";
import { FILTER_STATUS_SCHEDULED, POST_STATUS, SCHEDULED_STATUS_CLASS, STATUS_CONFIG } from "@constants/postStatus";

type SchedulablePost = { status: string; scheduled_for?: string | null };

/** True when draft has a future scheduled_for date. */
export function isPostScheduled(post: SchedulablePost): boolean {
  return post.status === POST_STATUS.DRAFT && !!post.scheduled_for && dayjs(post.scheduled_for).isAfter(dayjs());
}

/** True when draft missed its scheduled publish window. */
export function isPostScheduleOverdue(post: SchedulablePost): boolean {
  return post.status === POST_STATUS.DRAFT && !!post.scheduled_for && !dayjs(post.scheduled_for).isAfter(dayjs());
}

/** Resolves post status label and pill colors, including scheduled drafts. */
export function resolvePostStatusDisplay(status: string, scheduledFor?: string): PostStatusDisplay {
  if (status === POST_STATUS.DRAFT && scheduledFor && dayjs(scheduledFor).isAfter(dayjs())) {
    return { label: LABELS.POST_STATUS_SCHEDULED, className: SCHEDULED_STATUS_CLASS };
  }
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG[POST_STATUS.DRAFT];
  return config;
}

export { FILTER_STATUS_SCHEDULED };
