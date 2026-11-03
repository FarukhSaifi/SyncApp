import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { RADIUS } from "@constants/designTokens";
import { LABELS } from "@constants/messages";
import { SEO_CATEGORIES, SEO_CATEGORY_LABELS, SEO_HELPER_COPY, type SeoCategoryId } from "@constants/seo";
import { useThemeColors } from "@contexts/ThemeContext";
import type { SeoCheck, SeoScoreBreakdownProps } from "@types";

function CheckIcon({
  ok,
  warning,
  colors,
}: {
  ok: boolean | null;
  warning?: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  if (ok === true) {
    return <Ionicons name="checkmark-circle" size={14} color={colors.positive} />;
  }
  if (ok === false) {
    if (warning) {
      return <Ionicons name="warning" size={14} color={colors.warning} />;
    }
    return <Ionicons name="close-circle" size={14} color={colors.destructive} />;
  }
  return <View style={{ width: 14, height: 1, backgroundColor: colors.muted, marginTop: 6 }} />;
}

function checkLabelColor(
  ok: boolean | null,
  warning: boolean | undefined,
  colors: ReturnType<typeof useThemeColors>,
): string {
  if (ok === true) {
    return colors.positive;
  }
  if (ok === false) {
    return warning ? colors.warning : colors.destructive;
  }
  return colors.mutedForeground;
}

function CheckRows({
  checks,
  colors,
  styles,
  keyPrefix,
}: {
  checks: SeoCheck[];
  colors: ReturnType<typeof useThemeColors>;
  styles: ReturnType<typeof createStyles>;
  keyPrefix: string;
}) {
  return (
    <View style={styles.checkList}>
      {checks.map((check) => (
        <View key={`${keyPrefix}-${check.label}`} style={styles.checkRow}>
          <CheckIcon ok={check.ok} warning={check.warning} colors={colors} />
          <Text style={[styles.checkLabel, { color: checkLabelColor(check.ok, check.warning, colors) }]}>
            {check.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Live SEO checklist with pass / warn / fail coloring (editor Details tab).
 */
export function SeoScoreBreakdown({
  checks,
  categories,
  score,
  maxScore,
  showHeader = false,
}: SeoScoreBreakdownProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const groups =
    categories && categories.length > 0
      ? categories.filter((g) => g.checks.length > 0)
      : (Object.values(SEO_CATEGORIES) as SeoCategoryId[])
          .map((id) => ({
            id,
            checks: checks.filter((c) => c.category === id),
          }))
          .filter((g) => g.checks.length > 0);

  const flatFallback = groups.length === 0 ? checks : null;

  return (
    <View style={styles.container}>
      {showHeader && typeof score === "number" && typeof maxScore === "number" ? (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {LABELS.SEO_SCORE_HEADING}: {LABELS.SEO_SCORE_VALUE(score, maxScore)}
          </Text>
          <Text style={styles.note}>{SEO_HELPER_COPY.SCORECARD_NOTE}</Text>
          <Text style={styles.note}>{SEO_HELPER_COPY.DENSITY_NOTE}</Text>
        </View>
      ) : null}

      {flatFallback ? (
        <CheckRows checks={flatFallback} colors={colors} styles={styles} keyPrefix="flat" />
      ) : (
        <View style={styles.groups}>
          {groups.map((group) => (
            <View key={group.id} style={styles.group}>
              <Text style={styles.groupTitle}>{SEO_CATEGORY_LABELS[group.id]}</Text>
              <CheckRows checks={group.checks} colors={colors} styles={styles} keyPrefix={group.id} />
            </View>
          ))}
        </View>
      )}

      {checks.length === 0 ? <Text style={styles.empty}>{LABELS.SEO_SCORE_UNKNOWN}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      gap: 10,
    },
    header: {
      gap: 4,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
    },
    note: {
      fontSize: 10,
      lineHeight: 14,
      color: colors.mutedForeground,
    },
    groups: {
      gap: 10,
    },
    group: {
      gap: 4,
    },
    groupTitle: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: colors.mutedForeground,
    },
    checkList: {
      gap: 4,
    },
    checkRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    checkLabel: {
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
    },
    empty: {
      fontSize: 12,
      color: colors.mutedForeground,
      borderRadius: RADIUS.SM,
    },
  });
