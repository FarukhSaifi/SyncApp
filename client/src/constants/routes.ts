/**
 * Client-side route paths (App Router).
 */
export const ROUTES = Object.freeze({
  DASHBOARD: "/",
  EDITOR: "/editor",
  SETTINGS: "/settings",
  PROFILE: "/profile",
  USERS: "/users",
  LOGIN: "/login",
  REGISTER: "/register",
  ANALYTICS: "/analytics",
} as const);

/** Routes that require the posts API — avoids fetching on analytics, settings, etc. */
export function routeNeedsPosts(pathname: string): boolean {
  return pathname === ROUTES.DASHBOARD || pathname === ROUTES.EDITOR || pathname.startsWith(`${ROUTES.EDITOR}/`);
}
