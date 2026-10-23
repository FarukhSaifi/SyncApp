import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/tabs";
import type { ElementRef, RefObject } from "react";
import type { View } from "react-native";

export type NativeView = ElementRef<typeof View>;
export type TabIconName = keyof typeof Ionicons.glyphMap;

export type TabRoute = BottomTabBarProps["state"]["routes"][number];

export type TabLayout = {
  x: number;
  width: number;
};

/** Custom tab bar — matches Expo Router / React Navigation SDK 58 `tabBar` props. */
export type FloatingTabBarProps = BottomTabBarProps;

export type TabItemProps = {
  focused: boolean;
  iconName: TabIconName;
  tint: string;
  muted: string;
  onPress: () => void;
  label: string;
  dropRef: RefObject<NativeView | null>;
  tabKey: string;
  onMeasured: (key: string, layout: TabLayout) => void;
};

export type NewPostFabProps = {
  label: string;
  onPress: () => void;
};
