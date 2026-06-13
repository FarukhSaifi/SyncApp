import { LABELS } from "@constants/messages";
import { POST_STATUS, SCHEDULED_STATUS_CLASS, STATUS_CONFIG } from "@constants/postStatus";
import dayjs from "dayjs";

export interface PostStatusDisplay {
  label: string;
  className: string;
}

/** Resolves post status label and pill colors, including scheduled drafts. */
export function resolvePostStatusDisplay(status: string, scheduledFor?: string): PostStatusDisplay {
  if (status === POST_STATUS.DRAFT && scheduledFor && dayjs(scheduledFor).isAfter(dayjs())) {
    return { label: LABELS.POST_STATUS_SCHEDULED, className: SCHEDULED_STATUS_CLASS };
  }
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG[POST_STATUS.DRAFT];
  return config;
}
