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

/** Pill badge base classes — use with semantic color classes from STATUS_CONFIG, ROLE_CONFIG, etc. */
export const PILL_SIZES = Object.freeze({
  SM: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
  MD: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
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

/** Modal / overlay body scroll lock values */
export const MODAL_BODY_OVERFLOW = Object.freeze({
  HIDDEN: "hidden",
  UNSET: "unset",
  DEFAULT_SIZE: "md",
} as const);

/** Shared keyboard key names for UI handlers. */
export const KEYBOARD_KEYS = Object.freeze({
  ESCAPE: "Escape",
  ENTER: "Enter",
  SPACE: " ",
} as const);

/** next/image defaults for LazyImage */
export const LAZY_IMAGE = Object.freeze({
  DEFAULT_ALT: "Image",
  DATA_URI_PREFIX: "data:",
  SIZES: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  SKELETON_CLASS: "absolute inset-0",
} as const);

/**
 * App shell header — keep the mobile bar compact (≤ ~15% of viewport).
 * CSS variable `--app-header-height` in globals.css must stay in sync.
 */
export const APP_HEADER = Object.freeze({
  /** Outer header classes (sticky shell + mobile height cap). */
  ROOT_CLASS: "app-header border-b bg-card sticky top-0 z-30 shrink-0 max-md:max-h-[15dvh]",
  /** Inner padding / row height: compact on mobile, roomier on md+. */
  INNER_CLASS: "container mx-auto flex h-12 max-h-[15dvh] items-center px-3 md:h-auto md:max-h-none md:px-4 md:py-4",
  /** Header mark — square brand image beside the wordmark. */
  LOGO_IMAGE_CLASS: "h-6 w-6 shrink-0 rounded-md object-cover md:h-8 md:w-8",
  /** Auth screens — larger centered brand mark. */
  LOGO_AUTH_IMAGE_CLASS: "mx-auto h-14 w-14 rounded-xl object-cover shadow-sm",
  LOGO_SIZE_PX: 32,
  LOGO_AUTH_SIZE_PX: 56,
  LOGO_TEXT_CLASS: "text-lg font-bold text-foreground md:text-2xl",
  ACTIONS_GAP_CLASS: "flex items-center gap-2 md:gap-4",
  THEME_BUTTON_CLASS:
    "flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors touch-manipulation hover:bg-primary/20 hover:text-foreground min-h-10 min-w-10 md:min-h-0 md:min-w-0 md:p-2.5",
  MENU_BUTTON_CLASS:
    "flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-primary/20 hover:text-foreground min-h-10 min-w-10",
} as const);
