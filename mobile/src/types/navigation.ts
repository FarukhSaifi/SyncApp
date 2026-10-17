import { Ionicons } from "@expo/vector-icons";
import type { ElementRef, RefObject } from "react";
import type { View } from "react-native";

export type NativeView = ElementRef<typeof View>;
export type TabIconName = keyof typeof Ionicons.glyphMap;

export type TabRoute = {
  key: string;
  name: string;
  params?: object;
};

export type TabLayout = {
  x: number;
  width: number;
};

export type FloatingTabBarProps = {
  state: { index: number; routes: TabRoute[] };
  descriptors: Record<string, { options: { title?: string; tabBarLabel?: unknown } }>;
  navigation: {
    emit: (event: { type: "tabPress"; target: string; canPreventDefault?: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string, params?: object) => void;
  };
};

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
