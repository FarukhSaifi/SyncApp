import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { RADIUS, SETTINGS_LAYOUT } from "@constants/designTokens";
import { useThemeColors } from "@contexts/ThemeContext";
import type { SettingsSectionNavProps } from "@types";

/** Horizontal section chips — matches web mobile SettingsSectionNav. */
export function SettingsSectionNav({ items, activeId, onSelect }: SettingsSectionNavProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <Pressable
            key={item.id}
            onPress={() => {
              onSelect(item.id);
            }}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    scroll: { marginBottom: SETTINGS_LAYOUT.SECTION_GAP, flexGrow: 0 },
    row: { flexDirection: "row", gap: 8, paddingRight: 8 },
    chip: {
      paddingHorizontal: SETTINGS_LAYOUT.CHIP_PADDING_X,
      paddingVertical: SETTINGS_LAYOUT.CHIP_PADDING_Y,
      borderRadius: RADIUS.MD,
      backgroundColor: "transparent",
    },
    chipActive: {
      backgroundColor: `${colors.primary}1a`,
    },
    chipText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.mutedForeground,
    },
    chipTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
  });
