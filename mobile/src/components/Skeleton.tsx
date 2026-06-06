import { useEffect, useMemo } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Pulse skeleton — mirrors web `animate-pulse rounded bg-muted/60` */
export function Skeleton({ width = "100%", height = 16, borderRadius = RADIUS.MD, style }: SkeletonProps) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const base = useMemo(
    () =>
      StyleSheet.create({
        bone: {
          width,
          height,
          borderRadius,
          backgroundColor: colors.muted,
        },
      }),
    [colors.muted, width, height, borderRadius],
  );

  return <Animated.View style={[base.bone, animatedStyle, style]} accessibilityElementsHidden />;
}
