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

/** iOS 26–style corner radii (continuous, larger surfaces) */
export const RADIUS = Object.freeze({
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 28,
  FULL: 9999,
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
  /** Floating drop tab bar (pill above home indicator) */
  TAB_BAR_FLOATING_HEIGHT: 64,
  TAB_BAR_HORIZONTAL_INSET: 20,
  /** Gap from physical screen bottom to the floating tab bar pill */
  TAB_BAR_BOTTOM_GAP: 8,
  TAB_BAR_NEW_POST_OVERHANG: 28,
  TAB_BAR_DROP_RADIUS: 28,
  TAB_BAR_CONTENT_EXTRA: 24,
} as const);

/** Floating tab bar motion + sizing */
export const TAB_BAR = Object.freeze({
  ICON_SIZE: 26,
  FAB_SIZE: 60,
  FAB_LIFT: 22,
  SPRING: { damping: 18, stiffness: 420 },
  SLIDE_SPRING: { damping: 22, stiffness: 320, mass: 0.85 },
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
