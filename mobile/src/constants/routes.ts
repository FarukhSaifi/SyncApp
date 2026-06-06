/** Expo Router paths — mirror web client ROUTES where applicable */
export const ROUTES = Object.freeze({
  TABS: "/(tabs)",
  LOGIN: "/(auth)/login",
  REGISTER: "/(auth)/register",
  EDITOR_NEW: "/editor/new",
  EDITOR_GENERATE_IMAGE: "/editor/generate-image",
  PROFILE: "/profile",
  USERS: "/(tabs)/users",
  SETTINGS: "/(tabs)/settings",
} as const);

export function editorRoute(id: string): `/editor/${string}` {
  return `/editor/${id}`;
}
