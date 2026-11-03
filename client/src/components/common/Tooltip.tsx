"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { TooltipProps, TooltipSide } from "@types";

import { TOOLTIP_SIDE_CLASS, TOOLTIP_UI } from "@constants/designTokens";

type PortalCoords = { top: number; left: number };

function computePortalPosition(rect: DOMRect, side: TooltipSide): PortalCoords {
  const gap = TOOLTIP_UI.PORTAL_GAP_PX;
  const midX = rect.left + rect.width / 2;
  const midY = rect.top + rect.height / 2;
  if (side === "bottom") {
    return { top: rect.bottom + gap, left: midX };
  }
  if (side === "left") {
    return { top: midY, left: rect.left - gap };
  }
  if (side === "right") {
    return { top: midY, left: rect.right + gap };
  }
  return { top: rect.top - gap, left: midX };
}

function portalTransformClass(side: TooltipSide): string {
  if (side === "bottom") {
    return "-translate-x-1/2";
  }
  if (side === "left") {
    return "-translate-x-full -translate-y-1/2";
  }
  if (side === "right") {
    return "-translate-y-1/2";
  }
  return "-translate-x-1/2 -translate-y-full";
}

/**
 * Lightweight tooltip (hover + focus-within).
 * Default: CSS absolute panel. `portal`: fixed panel on document.body (escapes table overflow).
 * Portal mode stays open while the cursor is over the trigger or the panel (dismiss delay bridges the gap).
 */
export default function Tooltip({
  content,
  children,
  side = "top",
  className = "",
  contentClassName = "",
  portal = false,
  "aria-label": ariaLabel,
}: TooltipProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<PortalCoords>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearHideTimer();
    setOpen(true);
  }, [clearHideTimer]);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      setOpen(false);
    }, TOOLTIP_UI.PORTAL_DISMISS_MS);
  }, [clearHideTimer]);

  useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, [clearHideTimer]);

  const updatePosition = useCallback(() => {
    const el = rootRef.current;
    if (!el) {
      return;
    }
    setCoords(computePortalPosition(el.getBoundingClientRect(), side));
  }, [side]);

  useLayoutEffect(() => {
    if (!portal || !open) {
      return;
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [portal, open, updatePosition]);

  if (!portal) {
    return (
      <span className={`group ${TOOLTIP_UI.ROOT} ${className}`.trim()} aria-label={ariaLabel}>
        {children}
        <span role="tooltip" className={`${TOOLTIP_UI.PANEL} ${TOOLTIP_SIDE_CLASS[side]} ${contentClassName}`.trim()}>
          {content}
        </span>
      </span>
    );
  }

  const portalPanel =
    mounted && open
      ? createPortal(
          <span
            role="tooltip"
            className={`${TOOLTIP_UI.PORTAL_PANEL} ${portalTransformClass(side)} ${contentClassName}`.trim()}
            style={{ top: coords.top, left: coords.left }}
            onMouseEnter={show}
            onMouseLeave={scheduleHide}
          >
            {content}
          </span>,
          document.body,
        )
      : null;

  return (
    <span
      ref={rootRef}
      className={`${TOOLTIP_UI.ROOT} ${className}`.trim()}
      aria-label={ariaLabel}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onFocus={show}
      onBlur={scheduleHide}
    >
      {children}
      {portalPanel}
    </span>
  );
}
