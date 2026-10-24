import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { SETTINGS_LAYOUT } from "@constants/designTokens";
import { useThemeColors } from "@contexts/ThemeContext";
import type { ScreenIntroProps } from "@types";

/** Page intro — parity with web `SettingsPageHeader` (text-2xl / muted desc). */
export function ScreenIntro({ title, description }: ScreenIntroProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.text}>{description}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    wrap: { marginBottom: SETTINGS_LAYOUT.HEADER_MARGIN_BOTTOM },
    title: {
      fontSize: SETTINGS_LAYOUT.HEADER_TITLE_SIZE,
      fontWeight: SETTINGS_LAYOUT.HEADER_TITLE_WEIGHT,
      color: colors.foreground,
      marginBottom: 6,
      letterSpacing: -0.3,
    },
    text: {
      fontSize: SETTINGS_LAYOUT.HEADER_DESC_SIZE,
      lineHeight: SETTINGS_LAYOUT.HEADER_DESC_LINE_HEIGHT,
      color: colors.mutedForeground,
    },
  });
