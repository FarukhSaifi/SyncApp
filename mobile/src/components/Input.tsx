import { useMemo } from "react";
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";

import { INPUT_SIZES, RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  size?: (typeof INPUT_SIZES)[keyof typeof INPUT_SIZES];
  containerStyle?: StyleProp<ViewStyle>;
}

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
      fontSize: 13,
      fontWeight: "500",
      color: colors.mutedForeground,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    input: {
      width: "100%",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: RADIUS.MD,
      backgroundColor: colors.muted,
      color: colors.foreground,
      fontSize: 17,
    },
    inputSm: { paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
    inputMd: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 17 },
    inputLg: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 17 },
    inputError: { borderColor: colors.destructive },
    hint: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
    error: { fontSize: 12, color: colors.destructive, marginTop: 4 },
  });
