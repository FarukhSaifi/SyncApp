/**
 * Central exports for all client constants.
 * Import from `@constants` — avoid deep paths unless breaking circular deps.
 */
export * from "./analytics";
export * from "./api";
export * from "./colorClasses";
export * from "./config";
export * from "./designTokens";
export * from "./editor";
export * from "./messages";
export * from "./pagination";
export * from "./platforms";
export * from "./postStatus";
export * from "./routes";
export * from "./seo";
export * from "./theme";
export * from "./userRoles";

export {
  SYNC_LABEL,
  UI_BUTTONS,
  UI_DESCRIPTIONS,
  UI_LABELS,
  UI_MESSAGES,
  UI_PLACEHOLDERS,
  UI_TITLES,
} from "./messages";

export const UI_TEXT = Object.freeze({
  appName: "SyncApp",
} as const);
