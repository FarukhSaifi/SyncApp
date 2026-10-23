/**
 * Static public asset paths (files live under `client/public/`).
 * Browsers also probe several of these at the site root automatically.
 */
export const APP_ICONS = Object.freeze({
  FAVICON_ICO: "/favicon.ico",
  FAVICON_PNG: "/favicon.png",
  ICON_PNG: "/icon.png",
  APPLE_TOUCH: "/apple-touch-icon.png",
  APPLE_TOUCH_PRECOMPOSED: "/apple-touch-icon-precomposed.png",
  /** Sizes for metadata `sizes` attributes */
  FAVICON_SIZE: "32x32",
  APPLE_TOUCH_SIZE: "180x180",
  ICON_SIZE: "512x512",
} as const);
