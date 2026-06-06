import type { Ionicons } from "@expo/vector-icons";
import type { ViewStyle } from "react-native";

/** Tab route name → Ionicons outline/filled pair for FloatingTabBar. */
export const TAB_ICONS: Record<
  string,
  { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }
> = Object.freeze({
  index: { outline: "home-outline", filled: "home" },
  analytics: { outline: "bar-chart-outline", filled: "bar-chart" },
  settings: { outline: "settings-outline", filled: "settings" },
  users: { outline: "people-outline", filled: "people" },
});

/** Overlay floating tab bar — must be absolute so it sits on the screen bottom edge. */
export const FLOATING_TAB_BAR_STYLE: ViewStyle = Object.freeze({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "transparent",
  borderTopWidth: 0,
  elevation: 0,
});
