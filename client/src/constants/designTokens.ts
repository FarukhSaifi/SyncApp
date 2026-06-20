/**
 * Get UI–inspired design tokens (Figma reference: Get UI - FREE Figma UI kit).
 * Use these for consistent colors, radius, and typography across the app.
 *
 * Color Scheme:
 * - Primary: Purple (#8B5CF6) - Main CTAs, links, primary actions
 * - Secondary: Light Purple - Subtle backgrounds and supporting elements
 * - Accent: Blue - Alternative emphasis and info states
 * - Warning: Orange - Caution and warning states
 * - Positive: Green - Success states
 * - Destructive: Red - Error and danger states
 */

/** Button size keys for UI */
export const BUTTON_SIZES = Object.freeze({
  DEFAULT: "default",
  SM: "sm",
  LG: "lg",
  ICON: "icon",
} as const);

/** Button variant keys for UI */
export const BUTTON_VARIANTS = Object.freeze({
  DEFAULT: "default",
  PRIMARY: "primary",
  SECONDARY: "secondary",
  SUBTLE: "subtle",
  ACCENT: "accent",
  WARNING: "warning",
  DANGER: "danger",
  /** Alias for danger/destructive styling (e.g. delete confirmations) */
  DESTRUCTIVE: "destructive",
  POSITIVE: "positive",
  OUTLINE: "outline",
  GHOST: "ghost",
  LINK: "link",
  SELECTED: "selected",
} as const);

/** Input sizes */
export const INPUT_SIZES = Object.freeze({
  SM: "sm",
  MD: "md",
  LG: "lg",
} as const);

/** Loading / spinner UI (single source for sizing) */
export const LOADING_UI = Object.freeze({
  SPINNER_SIZE_CLASS: "h-12 w-12",
  SPINNER_BORDER_CLASS: "border-2 border-primary border-t-transparent",
  INLINE_MIN_HEIGHT_CLASS: "min-h-[300px]",
} as const);

/** Modal sizes and their max-width styling classes */
export const MODAL_SIZE_CLASSES = Object.freeze({
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
} as const);
