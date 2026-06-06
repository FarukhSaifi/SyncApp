/** App identity + native shell colors — single Node-side source for app.config.ts and scripts. */
const APP_IDENTITY = Object.freeze({
  NAME: "SyncApp",
  SLUG: "syncapp-mobile",
  SCHEME: "syncapp",
  VERSION: "1.0.0",
});

/** Expo / EAS project — from expo.dev (not a secret). Override with EAS_PROJECT_ID in .env if needed. */
const EAS_PROJECT_ID = "fc6f629e-e523-46cd-8c38-90f3b1736067";

/** Matches src/constants/palette.ts lightColors.secondary */
const BRAND_COLORS = Object.freeze({
  SPLASH_BACKGROUND: "#EDE9FE",
});

module.exports = { APP_IDENTITY, BRAND_COLORS, EAS_PROJECT_ID };
