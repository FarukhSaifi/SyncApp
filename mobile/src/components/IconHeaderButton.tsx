import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { GlassSurface } from "@/src/components/GlassSurface";
import { HEADER_ICON_BUTTON, RADIUS, TAB_BAR } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { isLiquidGlassAvailable } from "@/src/utils/nativeGlass";

export interface IconHeaderButtonProps {
  accessibilityLabel: string;
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Circular glass header control with spring press scale + highlight. */
export function IconHeaderButton({ accessibilityLabel, onPress, children, style }: IconHeaderButtonProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(), []);
  const hasGlass = isLiquidGlassAvailable();
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    setPressed(true);
    scale.value = withSpring(HEADER_ICON_BUTTON.PRESS_SCALE, TAB_BAR.SPRING);
  };

  const handlePressOut = () => {
    setPressed(false);
    scale.value = withSpring(1, TAB_BAR.SPRING);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={HEADER_ICON_BUTTON.HIT_SLOP}
      style={[styles.hitTarget, style]}
    >
      <Animated.View style={[styles.button, animatedStyle]}>
        <GlassSurface borderRadius={RADIUS.FULL} interactive={pressed} />
        <View style={styles.iconLayer} pointerEvents="none">
          {children}
        </View>
        {pressed ? (
          <View
            style={[styles.pressOverlay, { backgroundColor: `${colors.primary}${HEADER_ICON_BUTTON.PRESS_OVERLAY_ALPHA}` }]}
            pointerEvents="none"
          />
        ) : null}
        {!hasGlass ? (
          <View
            style={[
              styles.fallbackBorder,
              pressed && { borderColor: colors.primary },
              { borderColor: `${colors.border}${HEADER_ICON_BUTTON.FALLBACK_BORDER_ALPHA}` },
            ]}
            pointerEvents="none"
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const createStyles = () =>
  StyleSheet.create({
    hitTarget: {
      width: HEADER_ICON_BUTTON.SIZE,
      height: HEADER_ICON_BUTTON.SIZE,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: HEADER_ICON_BUTTON.SHADOW.COLOR,
          shadowOffset: { width: 0, height: HEADER_ICON_BUTTON.SHADOW.OFFSET_Y },
          shadowOpacity: HEADER_ICON_BUTTON.SHADOW.OPACITY,
          shadowRadius: HEADER_ICON_BUTTON.SHADOW.RADIUS,
        },
        android: { elevation: HEADER_ICON_BUTTON.SHADOW.ANDROID_ELEVATION },
        default: {},
      }),
    },
    button: {
      width: HEADER_ICON_BUTTON.SIZE,
      height: HEADER_ICON_BUTTON.SIZE,
      borderRadius: RADIUS.FULL,
      overflow: "hidden",
    },
    iconLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      zIndex: HEADER_ICON_BUTTON.Z_INDEX.ICON,
    },
    pressOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: RADIUS.FULL,
      zIndex: HEADER_ICON_BUTTON.Z_INDEX.OVERLAY,
    },
    fallbackBorder: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: RADIUS.FULL,
      borderWidth: StyleSheet.hairlineWidth,
      zIndex: HEADER_ICON_BUTTON.Z_INDEX.BORDER,
    },
  });
