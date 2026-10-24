import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabBarGlass } from "@components/TabBarGlass";
import { LABELS, ROUTES } from "@constants";
import { HEADER_ICON_BUTTON, IOS26, RADIUS, TAB_BAR } from "@constants/designTokens";
import { TAB_ICONS } from "@constants/navigation";
import { useThemeColors } from "@contexts/ThemeContext";
import type { FloatingTabBarProps, NativeView, NewPostFabProps, TabItemProps, TabLayout, TabRoute } from "@types";

const TAB_SPRING = TAB_BAR["SPRING"];
const SLIDE_SPRING = TAB_BAR["SLIDE_SPRING"];
const ICON_SIZE = TAB_BAR["ICON_SIZE"];
const FAB_SIZE = TAB_BAR["FAB_SIZE"];
const FAB_LIFT = TAB_BAR["FAB_LIFT"];

function tabLabel(options: { title?: string; tabBarLabel?: unknown }, routeName: string): string {
  if (typeof options.tabBarLabel === "string") {
    return options.tabBarLabel;
  }
  return options.title ?? routeName;
}

function TabItem({ focused, iconName, tint, muted, onPress, label, dropRef, tabKey, onMeasured }: TabItemProps) {
  const scale = useSharedValue(1);
  const slotRef = useRef<NativeView>(null);

  const measureInDrop = useCallback(() => {
    const drop = dropRef.current;
    const slot = slotRef.current;
    if (!drop || !slot) {
      return;
    }
    slot.measureLayout(
      drop,
      (x: number, _y: number, width: number) => {
        onMeasured(tabKey, { x, width });
      },
      () => undefined,
    );
  }, [dropRef, tabKey, onMeasured]);

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View ref={slotRef} style={tabStyles.tabSlot} onLayout={measureInDrop}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(TAB_BAR["PRESS_SCALE_TAB"], TAB_SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, TAB_SPRING);
        }}
        style={tabStyles.tab}
        accessibilityRole="tab"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={label}
      >
        <Animated.View style={iconWrapStyle}>
          <Ionicons name={iconName} size={ICON_SIZE} color={focused ? tint : muted} />
        </Animated.View>
        <Text
          style={[tabStyles.label, { color: focused ? tint : muted, fontWeight: focused ? "700" : "500" }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function NewPostFab({ label, onPress }: NewPostFabProps) {
  const scale = useSharedValue(1);
  const colors = useThemeColors();

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={tabStyles.fabSlot} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(TAB_BAR["PRESS_SCALE_FAB"], TAB_SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, TAB_SPRING);
        }}
        style={tabStyles.fabPressable}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Animated.View style={[tabStyles.fabCircle, { backgroundColor: colors.primary }, circleStyle]}>
          <Ionicons name="add" size={TAB_BAR["FAB_ICON_SIZE"]} color={colors.primaryForeground} />
        </Animated.View>
      </Pressable>
      <Text style={[tabStyles.fabLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Home | Analytics | (+) | Settings | Users — sliding pill + elevated FAB. */
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: FloatingTabBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const containerStyles = useMemo(() => createContainerStyles(colors, insets.bottom), [colors, insets.bottom]);

  const dropRef = useRef<NativeView>(null);
  const [tabLayouts, setTabLayouts] = useState<Record<string, TabLayout>>({});

  const tabRoutes = state.routes.filter((r) => r.name !== TAB_BAR["NEW_POST_ROUTE"]);
  const splitAt = Math.ceil(tabRoutes.length / 2);
  const leftRoutes = tabRoutes.slice(0, splitAt);
  const rightRoutes = tabRoutes.slice(splitAt);

  const activeRoute = state.routes[state.index];
  const showSlide = activeRoute != null && activeRoute.name !== TAB_BAR["NEW_POST_ROUTE"];

  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);

  const onMeasured = useCallback((key: string, layout: TabLayout) => {
    setTabLayouts((prev) => {
      if (prev[key]?.x === layout.x && prev[key]?.width === layout.width) {
        return prev;
      }
      return { ...prev, [key]: layout };
    });
  }, []);

  useEffect(() => {
    if (!showSlide || !activeRoute) {
      return;
    }
    const layout = tabLayouts[activeRoute.key];
    if (!layout) {
      return;
    }
    const pad = TAB_BAR["SLIDE_PAD"];
    indicatorW.value = withSpring(Math.max(layout.width - pad * 2, TAB_BAR["SLIDE_MIN_WIDTH"]), SLIDE_SPRING);
    indicatorX.value = withSpring(layout.x + pad, SLIDE_SPRING);
  }, [activeRoute, showSlide, tabLayouts, indicatorX, indicatorW]);

  const slideStyle = useAnimatedStyle(() => ({
    width: indicatorW.value,
    transform: [{ translateX: indicatorX.value }],
    opacity: showSlide ? 1 : 0,
  }));

  const routeIndex = (route: TabRoute) => state.routes.findIndex((r) => r.key === route.key);

  const renderTab = (route: TabRoute) => {
    const idx = routeIndex(route);
    const { options } = descriptors[route.key];
    const label = tabLabel(options, route.name);
    const isFocused = state.index === idx;
    const icons = TAB_ICONS[route.name];
    const iconName = isFocused && icons ? icons.filled : (icons?.outline ?? "ellipse-outline");

    const onPress = () => {
      const event = emitter.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigateToTab(route.key);
      }
    };

    return (
      <TabItem
        key={route.key}
        focused={isFocused}
        iconName={iconName}
        tint={colors.primary}
        muted={colors.mutedForeground}
        onPress={onPress}
        label={label}
        dropRef={dropRef}
        tabKey={route.key}
        onMeasured={onMeasured}
      />
    );
  };

  return (
    <View style={containerStyles.wrapper} pointerEvents="box-none">
      <View style={containerStyles.dropOuter}>
        <View ref={dropRef} style={containerStyles.drop} collapsable={false}>
          <TabBarGlass />
          <Animated.View
            pointerEvents="none"
            style={[tabStyles.slidePill, { backgroundColor: `${colors.primary}20` }, slideStyle]}
          />
          <View style={tabStyles.sideGroup}>{leftRoutes.map(renderTab)}</View>
          <NewPostFab label={LABELS["TAB_NEW"]} onPress={() => router.push(ROUTES["EDITOR_NEW"])} />
          <View style={tabStyles.sideGroup}>{rightRoutes.map(renderTab)}</View>
        </View>
      </View>
    </View>
  );
}

const barRowStyle = {
  flexDirection: "row" as const,
  alignItems: "flex-end" as const,
  height: IOS26["TAB_BAR_FLOATING_HEIGHT"],
  borderRadius: IOS26["TAB_BAR_DROP_RADIUS"],
  borderWidth: StyleSheet.hairlineWidth,
  paddingHorizontal: 4,
  backgroundColor: "transparent" as const,
};

const tabStyles = StyleSheet.create({
  sideGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    minWidth: 0,
  },
  tabSlot: {
    flex: 1,
    minWidth: 0,
    zIndex: 2,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    maxWidth: 72,
    textAlign: "center",
  },
  fabSlot: {
    width: FAB_SIZE + 8,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 6,
    zIndex: 4,
  },
  fabPressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  fabCircle: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: RADIUS["FULL"],
    alignItems: "center",
    justifyContent: "center",
    marginTop: -FAB_LIFT,
    ...Platform.select({
      ios: {
        shadowColor: HEADER_ICON_BUTTON.SHADOW.COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  fabLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
  slidePill: {
    position: "absolute",
    top: 8,
    bottom: 8,
    borderRadius: RADIUS["FULL"],
    zIndex: 1,
  },
});

const createContainerStyles = (colors: ReturnType<typeof useThemeColors>, bottomInset: number) =>
  StyleSheet.create({
    wrapper: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: IOS26["TAB_BAR_HORIZONTAL_INSET"],
      paddingBottom: bottomInset + IOS26["TAB_BAR_BOTTOM_GAP"],
    },
    dropOuter: {
      borderRadius: IOS26["TAB_BAR_DROP_RADIUS"],
      overflow: "visible",
      ...Platform.select({
        ios: {
          shadowColor: HEADER_ICON_BUTTON.SHADOW.COLOR,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        android: { elevation: 6 },
        default: {},
      }),
    },
    drop: {
      ...barRowStyle,
      borderColor: `${colors.border}80`,
      overflow: "visible",
    },
  });
