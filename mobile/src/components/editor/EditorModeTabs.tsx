import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import type { EditorMode } from "@/src/types";

interface EditorModeTabsProps {
  mode: EditorMode;
  onChangeMode: (mode: EditorMode) => void;
  channelCount: number;
}

const MODES: Array<{
  id: EditorMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: "write", label: "Write", icon: "create-outline" },
  { id: "channels", label: "Channels", icon: "paper-plane-outline" },
  { id: "details", label: "Details", icon: "options-outline" },
];

export function EditorModeTabs({
  mode,
  onChangeMode,
  channelCount,
}: EditorModeTabsProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.tabContainer} accessibilityRole="tablist">
      {MODES.map((item) => {
        const active = mode === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChangeMode(item.id)}
            style={[styles.tabButton, active && styles.tabButtonActive]}
          >
            <Ionicons
              name={item.icon}
              size={16}
              color={active ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {item.label}
            </Text>

            {item.id === "channels" && channelCount > 0 ? (
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
                  {channelCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    tabContainer: {
      flexDirection: "row",
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 12,
      borderRadius: RADIUS.LG,
      padding: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 4,
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 9,
      borderRadius: RADIUS.MD,
      gap: 6,
    },
    tabButtonActive: {
      backgroundColor: colors.background,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    tabLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    tabLabelActive: {
      color: colors.foreground,
      fontWeight: "700",
    },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: RADIUS.FULL,
      backgroundColor: colors.secondary,
    },
    badgeActive: {
      backgroundColor: `${colors.primary}20`,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.mutedForeground,
    },
    badgeTextActive: {
      color: colors.primary,
    },
  });
