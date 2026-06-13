import type { StatusPillProps } from "@types";

import { PILL_SIZES } from "@constants/designTokens";

/** Consistent pill badge used for post status, roles, connection state, and similar labels. */
export default function StatusPill({ label, className = "", size = "MD", children }: StatusPillProps) {
  return (
    <span className={`${PILL_SIZES[size]} ${className}`.trim()}>
      {children}
      {label}
    </span>
  );
}
