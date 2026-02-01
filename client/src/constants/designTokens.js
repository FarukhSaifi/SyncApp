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

/** Border radius (slightly rounded, soft feel) */
export const RADIUS = Object.freeze({
  sm: "0.375rem", // 6px
  md: "0.5rem", // 8px
  lg: "0.625rem", // 10px
  full: "9999px",
});

/** Semantic color names aligned with Get UI kit */
export const SEMANTIC_NAMES = Object.freeze({
  PRIMARY: "primary",
  SECONDARY: "secondary",
  ACCENT: "accent",
  SUBTLE: "subtle",
  WARNING: "warning",
  DANGER: "danger",
  DESTRUCTIVE: "destructive",
  POSITIVE: "positive",
  DEFAULT: "default",
  SELECTED: "selected",
});

/** Button variant keys for UI */
export const BUTTON_VARIANTS = Object.freeze({
  DEFAULT: "default",
  PRIMARY: "primary",
  SECONDARY: "secondary",
  SUBTLE: "subtle",
  ACCENT: "accent",
  WARNING: "warning",
  DANGER: "danger",
  POSITIVE: "positive",
  OUTLINE: "outline",
  GHOST: "ghost",
  LINK: "link",
  SELECTED: "selected",
});

/** Input sizes */
export const INPUT_SIZES = Object.freeze({
  SM: "sm",
  MD: "md",
  LG: "lg",
});
