import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { LOADING_UI } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<SpinnerSize, number> = {
  sm: LOADING_UI.SPINNER_SIZE_SM,
  md: LOADING_UI.SPINNER_SIZE,
  lg: LOADING_UI.SPINNER_SIZE,
};

/** Web-style ring: border-primary border-t-transparent, spinning */
export function Spinner({ size = "md", color, style }: SpinnerProps) {
  const colors = useThemeColors();
  const spin = useRef(new Animated.Value(0)).current;
  const dimension = SIZE_MAP[size];
  const ringColor = color ?? colors.primary;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ring: {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          borderWidth: LOADING_UI.SPINNER_BORDER_WIDTH,
          borderColor: ringColor,
          borderTopColor: "transparent",
        },
      }),
    [dimension, ringColor],
  );

  return (
    <View style={style} accessibilityRole="progressbar">
      <Animated.View style={[styles.ring, { transform: [{ rotate }] }]} />
    </View>
  );
}
