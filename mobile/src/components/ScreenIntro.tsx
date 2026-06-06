import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/src/contexts/ThemeContext";

interface ScreenIntroProps {
  description: string;
}

/** Subtitle copy below the native large title — matches web page descriptions. */
export function ScreenIntro({ description }: ScreenIntroProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{description}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    wrap: { marginBottom: 16 },
    text: { fontSize: 15, lineHeight: 22, color: colors.mutedForeground },
  });
