import { useMemo } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { Spinner } from "@/src/components/Spinner";
import { LOADING_UI } from "@/src/constants/designTokens";
import { LABELS } from "@/src/constants/messages";
import { useThemeColors } from "@/src/contexts/ThemeContext";

interface LoadingScreenProps {
  message?: string;
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Full-page or inline loader — matches web LoadingScreen (primary ring + muted text). */
export function LoadingScreen({ message = LABELS.LOADING, inline = false, style }: LoadingScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors, inline), [colors, inline]);

  return (
    <View style={[styles.container, style]} accessibilityRole="progressbar" accessibilityLabel={message}>
      <Spinner size="md" />
      <Text style={styles.label}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>, inline: boolean) =>
  StyleSheet.create({
    container: {
      flex: inline ? undefined : 1,
      minHeight: inline ? LOADING_UI.INLINE_MIN_HEIGHT : undefined,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.groupedBackground,
      gap: 16,
      padding: 24,
    },
    label: { fontSize: 15, color: colors.mutedForeground, textAlign: "center" },
  });
