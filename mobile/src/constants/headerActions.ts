import { HEADER_ICON_BUTTON } from "./designTokens";

/** Layout metrics for header icon slots (theme, profile). */
export const HEADER_ACTION = Object.freeze({
  SLOT_SIZE: HEADER_ICON_BUTTON.SIZE,
  HORIZONTAL_INSET: HEADER_ICON_BUTTON.HORIZONTAL_INSET,
  /** Theme + profile on the trailing edge (matches client header actions). */
  TRAILING_SLOT_COUNT: 2,
  TRAILING_HOST_WIDTH: HEADER_ICON_BUTTON.SIZE * 2 + HEADER_ICON_BUTTON.HORIZONTAL_INSET + HEADER_ICON_BUTTON.HIT_SLOP,
} as const);
