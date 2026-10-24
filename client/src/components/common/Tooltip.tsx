"use client";

import type { TooltipProps, TooltipSide } from "@types";

import { TOOLTIP_UI } from "@constants/designTokens";

const SIDE_CLASS: Record<TooltipSide, string> = {
  top: TOOLTIP_UI.PANEL_TOP,
  bottom: TOOLTIP_UI.PANEL_BOTTOM,
  left: TOOLTIP_UI.PANEL_LEFT,
  right: TOOLTIP_UI.PANEL_RIGHT,
};

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
      <span role="tooltip" className={`${TOOLTIP_UI.PANEL} ${SIDE_CLASS[side]} ${contentClassName}`.trim()}>
        {content}
      </span>
    </span>
  );
}
