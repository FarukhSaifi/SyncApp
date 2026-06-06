import { HEADER_ICON_BUTTON } from "./designTokens";

/** Layout metrics for header icon slots (theme, profile). */
export const HEADER_ACTION = Object.freeze({
  SLOT_SIZE: HEADER_ICON_BUTTON.SIZE,
  HORIZONTAL_INSET: HEADER_ICON_BUTTON.HORIZONTAL_INSET,
  TRAILING_HOST_WIDTH: HEADER_ICON_BUTTON.SIZE + HEADER_ICON_BUTTON.HORIZONTAL_INSET,
} as const);
