/**
 * SyncApp v2 UI tokens (slothUI-inspired soft SaaS language).
 * Colors live in `app/globals.css`; use semantic Tailwind classes in UI.
 *
 * Color Scheme:
 * - Primary: Purple (#8B5CF6) - Main CTAs, links, primary actions
 * - Secondary: Soft purple tint - Subtle backgrounds
 * - Accent: Blue - Alternative emphasis and info states
 * - Warning: Orange - Caution and warning states
 * - Positive: Green - Success states
 * - Destructive: Red - Error and danger states
 * - Background: Soft gray canvas; cards stay elevated white / dark elevated
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

/** Shared select control — native select with custom chrome */
export const SELECT_UI = Object.freeze({
  WRAP: "relative inline-flex w-full min-w-0 items-center",
  WRAP_INLINE: "relative inline-flex min-w-0 items-center",
  SELECT:
    "w-full appearance-none rounded-lg border border-input bg-background text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  SELECT_SM: "h-8 py-1 pl-2.5 pr-8 text-xs",
  SELECT_MD: "h-10 py-2 pl-3 pr-9 text-sm",
  SELECT_LG: "h-11 py-2.5 pl-3.5 pr-10 text-sm",
  CHEVRON: "pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
  CHEVRON_SM: "pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground",
} as const);

/** Native date input with SyncApp field chrome (calendar icon + full-hit picker) */
export const DATE_INPUT_UI = Object.freeze({
  ROOT: "w-full min-w-0 space-y-1.5",
  LABEL: "block text-xs font-semibold uppercase tracking-wide text-muted-foreground",
  FIELD:
    "group relative flex min-w-0 items-center overflow-hidden rounded-lg border border-input bg-background shadow-sm transition-colors hover:border-primary/35 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
  FIELD_SM: "h-8",
  FIELD_MD: "h-10",
  FIELD_LG: "h-11",
  ICON: "pointer-events-none absolute left-3 z-[1] h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary group-focus-within:text-primary",
  ICON_SM:
    "pointer-events-none absolute left-2.5 z-[1] h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary group-focus-within:text-primary",
  INPUT:
    "h-full w-full min-w-0 cursor-pointer appearance-none border-0 bg-transparent text-sm tabular-nums text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50",
  INPUT_SM: "pl-8 pr-2 text-xs",
  INPUT_MD: "pl-10 pr-3",
  INPUT_LG: "pl-10 pr-3.5",
  /** Stretch native calendar affordance across the field; hide default icon */
  PICKER_HIT:
    "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
  ERROR: "text-xs text-destructive",
  HINT: "text-xs text-muted-foreground",
} as const);

/** Hover/focus tooltip panel (CSS, no portal) */
export const TOOLTIP_UI = Object.freeze({
  ROOT: "relative inline-flex max-w-full",
  PANEL:
    "pointer-events-none absolute z-50 w-max max-w-[16rem] rounded-lg border border-border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md opacity-0 invisible transition-opacity duration-150 group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible",
  PANEL_TOP: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  PANEL_BOTTOM: "top-full left-1/2 mt-2 -translate-x-1/2",
  PANEL_LEFT: "right-full top-1/2 mr-2 -translate-y-1/2",
  PANEL_RIGHT: "left-full top-1/2 ml-2 -translate-y-1/2",
  CONTENT_LIST: "flex flex-wrap gap-1",
  CHIP: "inline-flex max-w-full items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary",
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
 * App shell — desktop sidebar + compact mobile top bar / drawer.
 * CSS vars `--app-header-height` / `--app-sidebar-width` in globals.css stay in sync.
 */
export const APP_SHELL = Object.freeze({
  ROOT_CLASS: "min-h-screen bg-background flex",
  /** Editor keeps shell chrome but locks viewport height (status bar pins to bottom). */
  ROOT_EDITOR_CLASS: "h-dvh overflow-hidden bg-background flex",
  /** Fixed left sidebar (md+). */
  SIDEBAR_CLASS:
    "hidden md:flex md:w-[var(--app-sidebar-width)] md:shrink-0 md:flex-col md:border-r md:border-border md:bg-card md:sticky md:top-0 md:h-screen md:z-30",
  SIDEBAR_BRAND_CLASS: "flex items-center justify-between gap-2 px-4 py-4 border-b border-border",
  SIDEBAR_BRAND_LINK_CLASS: "flex min-w-0 items-center gap-2",
  SIDEBAR_NAV_CLASS: "flex-1 overflow-y-auto px-3 py-4 space-y-1",
  SIDEBAR_FOOTER_CLASS: "border-t border-border px-3 py-4 space-y-2",
  NAV_LINK_BASE:
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation",
  NAV_LINK_ACTIVE: "bg-primary text-primary-foreground",
  NAV_LINK_IDLE: "text-muted-foreground hover:text-foreground hover:bg-muted",
  CONTENT_COLUMN_CLASS: "flex min-w-0 flex-1 flex-col min-h-screen",
  CONTENT_COLUMN_EDITOR_CLASS: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  /** Compact mobile top chrome. */
  MOBILE_HEADER_CLASS: "app-header border-b border-border bg-card sticky top-0 z-30 shrink-0 md:hidden max-h-[15dvh]",
  MOBILE_HEADER_INNER_CLASS: "flex h-12 max-h-[15dvh] items-center justify-between gap-2 px-3",
  /** Slide-over drawer panel. */
  DRAWER_OVERLAY_CLASS: "fixed inset-0 z-40 bg-foreground/20 md:hidden",
  DRAWER_PANEL_CLASS:
    "fixed inset-y-0 left-0 z-50 flex w-[min(100%,var(--app-sidebar-width))] flex-col border-r border-border bg-card shadow-lg md:hidden",
  MAIN_CLASS: "flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8",
  /** Editor main — full-bleed under shell (no page padding / footer). */
  MAIN_EDITOR_CLASS: "flex min-h-0 flex-1 flex-col overflow-hidden",
  FOOTER_CLASS: "border-t border-border bg-card mt-auto",
  FOOTER_INNER_CLASS: "max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-muted-foreground",
  LOGO_IMAGE_CLASS: "h-7 w-7 shrink-0 rounded-lg object-cover md:h-8 md:w-8",
  LOGO_AUTH_IMAGE_CLASS: "mx-auto h-14 w-14 rounded-xl object-cover shadow-sm",
  LOGO_SIZE_PX: 32,
  LOGO_AUTH_SIZE_PX: 56,
  LOGO_TEXT_CLASS: "text-lg font-bold text-foreground truncate",
  THEME_BUTTON_CLASS:
    "flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors touch-manipulation hover:bg-muted hover:text-foreground min-h-10 min-w-10",
  MENU_BUTTON_CLASS:
    "flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground min-h-10 min-w-10",
  PROFILE_BUTTON_CLASS:
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
} as const);

/** @deprecated Prefer APP_SHELL — kept for AppLogo auth sizing compatibility. */
export const APP_HEADER = Object.freeze({
  ROOT_CLASS: APP_SHELL.MOBILE_HEADER_CLASS,
  INNER_CLASS: APP_SHELL.MOBILE_HEADER_INNER_CLASS,
  LOGO_IMAGE_CLASS: APP_SHELL.LOGO_IMAGE_CLASS,
  LOGO_AUTH_IMAGE_CLASS: APP_SHELL.LOGO_AUTH_IMAGE_CLASS,
  LOGO_SIZE_PX: APP_SHELL.LOGO_SIZE_PX,
  LOGO_AUTH_SIZE_PX: APP_SHELL.LOGO_AUTH_SIZE_PX,
  LOGO_TEXT_CLASS: APP_SHELL.LOGO_TEXT_CLASS,
  ACTIONS_GAP_CLASS: "flex items-center gap-2",
  THEME_BUTTON_CLASS: APP_SHELL.THEME_BUTTON_CLASS,
  MENU_BUTTON_CLASS: APP_SHELL.MENU_BUTTON_CLASS,
} as const);

/** Settings / Profile page layout (slothUI-style section hierarchy). */
export const SETTINGS_LAYOUT = Object.freeze({
  PAGE_CLASS: "space-y-8",
  HEADER_CLASS: "space-y-1.5 max-w-2xl",
  TITLE_CLASS: "text-2xl sm:text-3xl font-semibold tracking-tight text-foreground",
  DESCRIPTION_CLASS: "text-sm sm:text-base text-muted-foreground",
  BODY_CLASS: "flex flex-col lg:flex-row gap-6 lg:gap-10",
  SECTION_NAV_CLASS:
    "lg:w-52 shrink-0 flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0 lg:sticky lg:top-6 lg:self-start",
  SECTION_NAV_ITEM_BASE: "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
  SECTION_NAV_ITEM_ACTIVE: "bg-primary/10 text-primary",
  SECTION_NAV_ITEM_IDLE: "text-muted-foreground hover:bg-muted hover:text-foreground",
  SECTIONS_CLASS: "flex-1 min-w-0 space-y-6",
  CARD_CLASS: "rounded-xl border border-border bg-card shadow-none",
} as const);

/** Dashboard stats strip — mobile horizontal scroll (2 equal cards), lg+ 4-col grid. */
export const DASHBOARD_LAYOUT = Object.freeze({
  STATS_ROW_CLASS:
    "flex gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:snap-none",
  STATS_ITEM_CLASS: "shrink-0 snap-start w-[calc((100%-0.75rem)/2)] min-w-[8.5rem] lg:w-auto lg:min-w-0",
  STATS_SKELETON_CARD_CLASS: "border rounded-xl p-3 sm:p-5 bg-card space-y-2 sm:space-y-3 h-full",
  /** Compact icon actions on mobile PostCard */
  POST_CARD_ACTION_BTN_CLASS: "h-8 w-8 shrink-0",
  POST_CARD_ACTION_ICON_CLASS: "h-3.5 w-3.5",
  /** Posts / Users DataTable host card — flush table body, single border chrome */
  TABLE_CARD_CLASS: "overflow-hidden shadow-sm",
  TABLE_CARD_HEADER_CLASS: "space-y-1 border-b border-border p-4 pb-3 sm:px-5",
  TABLE_CARD_TITLE_CLASS: "text-base font-semibold leading-none tracking-tight sm:text-lg",
  TABLE_CARD_CONTENT_CLASS: "p-0",
} as const);
