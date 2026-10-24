import { useMemo } from "react";
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";

import { INPUT_SIZES, RADIUS } from "@constants/designTokens";
import { useThemeColors } from "@contexts/ThemeContext";
import type { InputProps } from "@types";

export function Input({ label, error, hint, size = INPUT_SIZES.MD, containerStyle, style, ...props }: InputProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hasError = Boolean(error);
  const sizeStyle =
    size === INPUT_SIZES.SM ? styles.inputSm : size === INPUT_SIZES.LG ? styles.inputLg : styles.inputMd;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, sizeStyle, hasError && styles.inputError, style]}
        {...props}
      />
      {Boolean(hint) && !hasError ? <Text style={styles.hint}>{hint}</Text> : null}
      {hasError ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: { width: "100%", marginBottom: 8 },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.foreground,
      marginBottom: 6,
    },
    input: {
      width: "100%",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.input,
      borderRadius: RADIUS.MD,
      backgroundColor: colors.background,
      color: colors.foreground,
      fontSize: 14,
    },
    inputSm: { paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, minHeight: 32 },
    inputMd: { paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 40 },
    inputLg: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 44 },
    inputError: { borderColor: colors.destructive },
    hint: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
    error: { fontSize: 12, color: colors.destructive, marginTop: 4 },
  });
