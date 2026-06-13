import { useMemo } from "react";

import StatusPill from "@components/common/StatusPill";
import { PILL_SIZES } from "@constants/designTokens";
import { resolvePostStatusDisplay } from "@utils/postStatusDisplay";

export interface PostStatusPillProps {
  status: string;
  scheduledFor?: string;
  size?: keyof typeof PILL_SIZES;
}

/** Post status pill — draft, published, archived, or scheduled when a future date is set. */
export default function PostStatusPill({ status, scheduledFor, size = "MD" }: PostStatusPillProps) {
  const { label, className } = useMemo(() => resolvePostStatusDisplay(status, scheduledFor), [status, scheduledFor]);

  return <StatusPill label={label} className={className} size={size} />;
}
