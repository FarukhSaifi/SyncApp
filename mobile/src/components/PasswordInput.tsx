import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Input, type InputProps } from "@/src/components/Input";
import { useThemeColors } from "@/src/contexts/ThemeContext";

type PasswordInputProps = Omit<InputProps, "secureTextEntry">;

export function PasswordInput(props: PasswordInputProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <Input {...props} secureTextEntry={!visible} style={[props.style, styles.inputWithToggle]} />
      <Pressable accessibilityRole="button" onPress={() => setVisible((v) => !v)} style={styles.toggle} hitSlop={8}>
        <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    wrap: { position: "relative", width: "100%" },
    inputWithToggle: { paddingRight: 44 },
    toggle: { position: "absolute", right: 12, top: 34, padding: 4 },
  });
