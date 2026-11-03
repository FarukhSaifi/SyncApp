/**
 * Stable `data-testid` values for Playwright / RTL.
 * Prefer these over brittle CSS or copy-based selectors.
 */
export const TEST_IDS = Object.freeze({
  LOGIN_FORM: "login-form",
  LOGIN_EMAIL: "login-email",
  LOGIN_PASSWORD: "login-password",
  LOGIN_SUBMIT: "login-submit",
  /** Present after client hydration — wait for this before submitting in E2E. */
  LOGIN_READY: "login-ready",
  DASHBOARD_NEW_POST: "dashboard-new-post",
  DASHBOARD_POST_LIST: "dashboard-post-list",
  POST_ROW: "post-row",
  EDITOR_TITLE: "editor-title",
  EDITOR_CONTENT: "editor-content",
  EDITOR_SAVE: "editor-save",
} as const);
