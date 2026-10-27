/** Design tokens — aligned with client + iOS 26 grouped UI */

export const BUTTON_SIZES = Object.freeze({
  DEFAULT: "default",
  SM: "sm",
  LG: "lg",
} as const);

export const BUTTON_VARIANTS = Object.freeze({
  DEFAULT: "default",
  PRIMARY: "primary",
  SECONDARY: "secondary",
  ACCENT: "accent",
  WARNING: "warning",
  DANGER: "danger",
  DESTRUCTIVE: "destructive",
  POSITIVE: "positive",
  OUTLINE: "outline",
  GHOST: "ghost",
} as const);

export const INPUT_SIZES = Object.freeze({
  SM: "sm",
  MD: "md",
  LG: "lg",
} as const);

/** Soft SaaS + iOS continuous radii (card surfaces align with web `rounded-xl` ≈ 12) */
export const RADIUS = Object.freeze({
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 28,
  FULL: 9999,
  /** Elevated cards / sheets — match client `--radius: 0.75rem` */
  CARD: 12,
} as const);

/**
 * Settings / Profile / screen section rhythm (v2 UI).
 * Mirrors client `SETTINGS_LAYOUT` (text-2xl title, space-y-6 sections, p-3 cards on mobile).
 */
export const SETTINGS_LAYOUT = Object.freeze({
  PAGE_PADDING: 16,
  SECTION_GAP: 24,
  CARD_PADDING: 12,
  CARD_GAP: 12,
  HEADER_TITLE_SIZE: 24,
  HEADER_TITLE_WEIGHT: "600" as const,
  HEADER_DESC_SIZE: 14,
  HEADER_DESC_LINE_HEIGHT: 20,
  HEADER_MARGIN_BOTTOM: 20,
  SECTION_TITLE_SIZE: 18,
  SECTION_TITLE_WEIGHT: "600" as const,
  SECTION_DESC_SIZE: 13,
  CHIP_PADDING_X: 12,
  CHIP_PADDING_Y: 8,
} as const);

/** Dimmed overlay behind sheets / modals */
export const OVERLAY = Object.freeze({
  SCRIM: "rgba(15, 23, 42, 0.45)",
  SCRIM_STRONG: "rgba(15, 23, 42, 0.55)",
} as const);

/** Press-to-show tooltip — mirrors client `TOOLTIP_UI` for tags / icon actions. */
export const TOOLTIP_UI = Object.freeze({
  MAX_WIDTH: 256,
  PANEL_PADDING_X: 10,
  PANEL_PADDING_Y: 8,
  PANEL_GAP: 6,
  FONT_SIZE: 12,
  Z_INDEX: 50,
  CHIP_PADDING_X: 8,
  CHIP_PADDING_Y: 3,
  CHIP_FONT_SIZE: 11,
  ACTION_ICON_SIZE: 32,
  ACTION_GLYPH_SIZE: 16,
} as const);

/** Full-viewport editor sheets (parity with web EditorMobileSheet) */
export const EDITOR_SHEET = Object.freeze({
  TITLE_BAR_HEIGHT: 52,
  MAX_HEIGHT: "100%" as const,
  BORDER_RADIUS: 0,
  BODY_PADDING: 16,
  CLOSE_HIT: 40,
} as const);

/** Header icon buttons (theme, profile) */
export const HEADER_ICON_BUTTON = Object.freeze({
  SIZE: 40,
  ICON_SIZE: 24,
  PROFILE_ICON_SIZE: 30,
  PRESS_SCALE: 0.88,
  HIT_SLOP: 8,
  /** Distance from screen edge to header icon buttons */
  HORIZONTAL_INSET: 24,
  PRESS_OVERLAY_ALPHA: "22",
  FALLBACK_BORDER_ALPHA: "99",
  SHADOW: Object.freeze({
    COLOR: "#000",
    OFFSET_Y: 2,
    OPACITY: 0.1,
    RADIUS: 6,
    ANDROID_ELEVATION: 3,
  }),
  Z_INDEX: Object.freeze({
    OVERLAY: 1,
    ICON: 2,
    BORDER: 3,
  }),
} as const);

/**
 * Brand mark — matches client `APP_SHELL` logo sizing.
 * Image source: `assets/images/logo.png`.
 */
export const APP_LOGO = Object.freeze({
  HEADER_SIZE: 28,
  AUTH_SIZE: 56,
  RADIUS_HEADER: 6,
  RADIUS_AUTH: 12,
  BRAND_GAP: 8,
  BRAND_NAME_SIZE: 17,
  BRAND_NAME_WEIGHT: "700" as const,
  /** Left header inset so logo+name align with content. */
  BRAND_HORIZONTAL_INSET: 8,
} as const);

/** Matches client LOADING_UI — primary ring spinner */
export const LOADING_UI = Object.freeze({
  SPINNER_SIZE: 48,
  SPINNER_SIZE_SM: 20,
  SPINNER_BORDER_WIDTH: 2,
  INLINE_MIN_HEIGHT: 300,
} as const);

/** Layout rhythm for grouped lists / sections */
export const IOS26 = Object.freeze({
  SCREEN_PADDING: 16,
  SECTION_GAP: 24,
  GROUPED_GAP: 12,
  LIST_ROW_MIN_HEIGHT: 44,
  /** Floating drop tab bar (pill above home indicator) — v2 soft SaaS chrome */
  TAB_BAR_FLOATING_HEIGHT: 64,
  TAB_BAR_HORIZONTAL_INSET: 20,
  /** Gap from physical screen bottom to the floating tab bar pill */
  TAB_BAR_BOTTOM_GAP: 10,
  TAB_BAR_NEW_POST_OVERHANG: 28,
  TAB_BAR_DROP_RADIUS: 24,
  TAB_BAR_CONTENT_EXTRA: 24,
} as const);

/** Floating tab bar motion + sizing */
export const TAB_BAR = Object.freeze({
  ICON_SIZE: 26,
  FAB_SIZE: 60,
  FAB_LIFT: 22,
  FAB_ICON_SIZE: 28,
  SPRING: { damping: 18, stiffness: 420 },
  SLIDE_SPRING: { damping: 22, stiffness: 320, mass: 0.85 },
  PRESS_SCALE_TAB: 0.92,
  PRESS_SCALE_FAB: 0.94,
  SLIDE_PAD: 6,
  SLIDE_MIN_WIDTH: 36,
  NEW_POST_ROUTE: "new-post",
} as const);

/** Shared layout dimensions */
export const LAYOUT = Object.freeze({
  COVER_PREVIEW_HEIGHT: 160,
  EDITOR_CONTENT_MIN_HEIGHT: 200,
  EDITOR_SCROLL_BOTTOM: 40,
  GENERATE_IMAGE_TOPIC_MIN_HEIGHT: 72,
  GENERATE_IMAGE_PREVIEW_MIN_HEIGHT: 240,
  IMAGE_PREVIEW_FRAME_MIN_HEIGHT: 220,
  SKELETON_CHIP_WIDTH: 72,
  SKELETON_CHIP_HEIGHT: 32,
} as const);

/** Analytics chart layout */
export const ANALYTICS_CHART = Object.freeze({
  WIDTH_PADDING: 48,
  INNER_PADDING: 32,
  LINE_HEIGHT: 180,
  BAR_HEIGHT: 160,
  BAR_WIDTH: 40,
  SPACING: 28,
} as const);

/** Phone / layout breakpoints (logical pixels) */
export const RESPONSIVE = Object.freeze({
  /** Below this width: tighter padding, stacked action rows, smaller charts */
  COMPACT_MAX_WIDTH: 390,
  TALL_MIN_HEIGHT: 800,
  CONTENT_MAX_WIDTH: 560,
  PADDING_COMPACT: 12,
  PADDING_DEFAULT: 16,
} as const);

export const TYPOGRAPHY = Object.freeze({
  LARGE_TITLE: { fontSize: 34, fontWeight: "700" as const, letterSpacing: 0.4 },
  TITLE1: { fontSize: 28, fontWeight: "700" as const },
  TITLE2: { fontSize: 22, fontWeight: "600" as const },
  TITLE3: { fontSize: 20, fontWeight: "600" as const },
  HEADLINE: { fontSize: 20, fontWeight: "600" as const },
  BODY: { fontSize: 17, fontWeight: "400" as const },
  CALLOUT: { fontSize: 16, fontWeight: "400" as const },
  SUBHEAD: { fontSize: 15, fontWeight: "400" as const },
  FOOTNOTE: { fontSize: 13, fontWeight: "400" as const },
  CAPTION: { fontSize: 12, fontWeight: "400" as const },
} as const);
