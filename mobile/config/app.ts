/** App identity + native shell colors — single source for app.config.ts and mobile build scripts. */
export const APP_IDENTITY = Object.freeze({
  NAME: "SyncApp",
  SLUG: "syncapp-mobile",
  SCHEME: "syncapp",
  VERSION: "2.0.0",
});

/** Expo / EAS project — from expo.dev (not a secret). Override with EAS_PROJECT_ID in .env if needed. */
export const EAS_PROJECT_ID = "fc6f629e-e523-46cd-8c38-90f3b1736067";

/** Matches src/constants/palette.ts lightColors.secondary */
export const BRAND_COLORS = Object.freeze({
  SPLASH_BACKGROUND: "#EDE9FE",
});
