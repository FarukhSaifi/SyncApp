import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Tooltip } from "@components/Tooltip";
import { LABELS } from "@constants/messages";
import { SEO_MOBILE_BADGE, SEO_THRESHOLDS } from "@constants/seo";
import { useThemeColors } from "@contexts/ThemeContext";
import type { SeoScoreBadgeProps } from "@types";
import { parseSeoScoreSummary } from "@utils/seoScorecard";

/**
 * Compact dashboard SEO badge — reads persisted `seo_score` (no list-side recompute).
 */
export function SeoScoreBadge({ post }: SeoScoreBadgeProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const score = typeof post.seo_score === "number" ? post.seo_score : null;
  const maxScore = SEO_THRESHOLDS.SCORE_MAX;
  const summary = (post.seo_score_summary || "").trim();
  const checks = useMemo(() => parseSeoScoreSummary(summary), [summary]);

  if (score === null) {
    return (
      <Tooltip content={<Text style={styles.tooltipText}>{LABELS.SEO_SCORE_PENDING}</Text>} side="top">
        <View
          style={[styles.badge, styles.badgePending]}
          accessibilityRole="image"
          accessibilityLabel={LABELS.SEO_SCORE_PENDING}
        >
          <Text style={styles.pendingText}>{LABELS.SEO_SCORE_UNKNOWN}</Text>
        </View>
      </Tooltip>
    );
  }

  const ratio = maxScore > 0 ? score / maxScore : 0;
  const toneColor =
    ratio >= SEO_THRESHOLDS.RING_GOOD_RATIO
      ? colors.positive
      : ratio >= SEO_THRESHOLDS.RING_MID_RATIO
        ? colors.warning
        : colors.destructive;

  const tipLines =
    checks.length > 0
      ? checks
          .slice(0, SEO_MOBILE_BADGE.TOOLTIP_CHECK_LIMIT)
          .map((c) => {
            const mark = c.ok === true ? "✓" : c.warning ? "!" : "×";
            return `${mark} ${c.label}`;
          })
          .join("\n")
      : LABELS.SEO_SCORE_VALUE(score, maxScore);

  return (
    <Tooltip
      content={<Text style={styles.tooltipText}>{tipLines}</Text>}
      side="top"
      accessibilityLabel={LABELS.SEO_SCORE_ARIA(score, maxScore, summary)}
    >
      <View
        style={[styles.badge, { borderColor: toneColor }]}
        accessibilityRole="image"
        accessibilityLabel={LABELS.SEO_SCORE_ARIA(score, maxScore, summary)}
      >
        <Text style={[styles.scoreText, { color: toneColor }]}>{score}</Text>
      </View>
    </Tooltip>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    badge: {
      width: SEO_MOBILE_BADGE.SIZE,
      height: SEO_MOBILE_BADGE.SIZE,
      borderRadius: SEO_MOBILE_BADGE.SIZE / 2,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    badgePending: {
      borderColor: colors.border,
    },
    scoreText: {
      fontSize: 11,
      fontWeight: "800",
    },
    pendingText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.mutedForeground,
    },
    tooltipText: {
      fontSize: 11,
      lineHeight: 15,
      color: colors.foreground,
    },
  });
