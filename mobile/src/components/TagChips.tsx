import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Tooltip } from "@components/Tooltip";
import { RADIUS, TOOLTIP_UI } from "@constants/designTokens";
import { LABELS } from "@constants/messages";
import { useThemeColors } from "@contexts/ThemeContext";
import type { TagChipsProps } from "@types";

/**
 * Compact tag list with overflow “+N more” tooltip listing remaining tags (desktop parity).
 */
export function TagChips({ tags, limit }: TagChipsProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!tags.length) {
    return <Text style={styles.empty}>{LABELS.NO_TAGS}</Text>;
  }

  const visible = tags.slice(0, limit);
  const overflow = tags.slice(limit);

  return (
    <View style={styles.wrap}>
      {visible.map((tag) => (
        <View key={tag} style={styles.chip}>
          <Text style={styles.chipText}>#{tag}</Text>
        </View>
      ))}
      {overflow.length > 0 ? (
        <Tooltip
          side="top"
          accessibilityLabel={LABELS.TAGS_OVERFLOW_TOOLTIP_ARIA(overflow.length)}
          content={
            <View style={styles.tooltipList}>
              {overflow.map((tag) => (
                <View key={tag} style={styles.chip}>
                  <Text style={styles.chipText}>#{tag}</Text>
                </View>
              ))}
            </View>
          }
        >
          <View style={styles.moreChip}>
            <Text style={styles.moreText}>{LABELS.TAGS_MORE(overflow.length)}</Text>
          </View>
        </Tooltip>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    wrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      alignItems: "center",
    },
    empty: {
      fontSize: 13,
      color: colors.mutedForeground,
    },
    chip: {
      maxWidth: "100%",
      backgroundColor: `${colors.primary}26`,
      paddingHorizontal: TOOLTIP_UI.CHIP_PADDING_X,
      paddingVertical: TOOLTIP_UI.CHIP_PADDING_Y,
      borderRadius: RADIUS.FULL,
    },
    chipText: {
      fontSize: TOOLTIP_UI.CHIP_FONT_SIZE,
      color: colors.primary,
      fontWeight: "500",
    },
    moreChip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: `${colors.muted}99`,
      paddingHorizontal: TOOLTIP_UI.CHIP_PADDING_X,
      paddingVertical: TOOLTIP_UI.CHIP_PADDING_Y,
      borderRadius: RADIUS.FULL,
    },
    moreText: {
      fontSize: TOOLTIP_UI.CHIP_FONT_SIZE,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    tooltipList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: TOOLTIP_UI.PANEL_GAP,
    },
  });
