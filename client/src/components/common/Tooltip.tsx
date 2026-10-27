"use client";

import type { TooltipProps } from "@types";

import { TOOLTIP_SIDE_CLASS, TOOLTIP_UI } from "@constants/designTokens";

/**
 * Lightweight CSS tooltip (hover + focus-within). Prefer for truncated lists and icon actions.
 */
export default function Tooltip({
  content,
  children,
  side = "top",
  className = "",
  contentClassName = "",
  "aria-label": ariaLabel,
}: TooltipProps) {
  return (
    <span className={`group ${TOOLTIP_UI.ROOT} ${className}`.trim()} aria-label={ariaLabel}>
      {children}
      <span role="tooltip" className={`${TOOLTIP_UI.PANEL} ${TOOLTIP_SIDE_CLASS[side]} ${contentClassName}`.trim()}>
        {content}
      </span>
    </span>
  );
}
