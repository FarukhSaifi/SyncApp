import { useMemo } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { HEADER_ICON_BUTTON, RADIUS } from "@constants/designTokens";
import { useThemeColors } from "@contexts/ThemeContext";
import type { IconHeaderButtonProps } from "@types";

/**
 * Flat header control — matches web `APP_SHELL.THEME_BUTTON_CLASS`
 * (rounded-lg, muted idle, soft hover/press).
 */
export function IconHeaderButton({ accessibilityLabel, onPress, children, style }: IconHeaderButtonProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={HEADER_ICON_BUTTON.HIT_SLOP}
      style={({ pressed }) => [styles.hitTarget, pressed && styles.pressed, style]}
    >
      <View style={styles.iconLayer} pointerEvents="none">
        {children}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    hitTarget: {
      width: HEADER_ICON_BUTTON.SIZE,
      height: HEADER_ICON_BUTTON.SIZE,
      borderRadius: RADIUS.MD,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    pressed: {
      backgroundColor: colors.muted,
    },
    iconLayer: {
      alignItems: "center",
      justifyContent: "center",
    },
  });
