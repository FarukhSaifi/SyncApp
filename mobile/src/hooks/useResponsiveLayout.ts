import { useWindowDimensions } from "react-native";

import { RESPONSIVE } from "@constants/designTokens";

/**
 * Phone-size breakpoints for padding, chart density, and stacked actions.
 * Uses existing design-token thresholds — no hard-coded magic widths in screens.
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isCompact = width < RESPONSIVE.COMPACT_MAX_WIDTH;
  const isTallPhone = height >= RESPONSIVE.TALL_MIN_HEIGHT;
  const contentMaxWidth = isCompact ? width : Math.min(width, RESPONSIVE.CONTENT_MAX_WIDTH);

  return {
    width,
    height,
    isCompact,
    isTallPhone,
    contentMaxWidth,
    horizontalPadding: isCompact ? RESPONSIVE.PADDING_COMPACT : RESPONSIVE.PADDING_DEFAULT,
  };
}
