import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TagChips } from "@components/TagChips";
import { Tooltip } from "@components/Tooltip";
import { APP_CONFIG } from "@constants/config";
import { RADIUS, SETTINGS_LAYOUT, TOOLTIP_UI } from "@constants/designTokens";
import { LABELS } from "@constants/messages";
import { POST_STATUS, STATUS_CONFIG, getStatusBadgeStyle, type StatusTone } from "@constants/postStatus";
import { useThemeColors } from "@contexts/ThemeContext";
import type { PostCardProps } from "@types";
import { formatDateTime } from "@utils/dateUtils";

export function PostCard({ post, onPress, onDelete }: PostCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const statusKey = (post.status in STATUS_CONFIG ? post.status : POST_STATUS.DRAFT) as keyof typeof STATUS_CONFIG;
  const statusConfig = STATUS_CONFIG[statusKey];
  const badgeStyle = getStatusBadgeStyle(colors, statusConfig.tone as StatusTone);

  const createdAt = post.created_at || post.createdAt;
  const updatedAt = post.updated_at || post.updatedAt;
  const tags = post.tags ?? [];

  const publishedPlatforms = useMemo(() => {
    if (!post.platform_status) {
      return [];
    }
    const entries: { platform: string; label: string }[] = [];
    if (post.platform_status.medium?.published) {
      entries.push({ platform: "medium", label: LABELS.MEDIUM });
    }
    if (post.platform_status.devto?.published) {
      entries.push({ platform: "devto", label: LABELS.DEVTO });
    }
    if (post.platform_status.wordpress?.published) {
      entries.push({ platform: "wordpress", label: LABELS.WORDPRESS_SHORT });
    }
    if (post.platform_status.linkedin?.published) {
      entries.push({ platform: "linkedin", label: LABELS.LINKEDIN });
    }
    return entries;
  }, [post.platform_status]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <View style={styles.headerActions}>
          <Tooltip
            openOn="longPress"
            onPress={onPress}
            content={<Text style={styles.tooltipLabel}>{LABELS.EDIT}</Text>}
            accessibilityLabel={LABELS.EDIT_POST_ARIA}
          >
            <View style={[styles.actionIcon, styles.actionIconEdit]}>
              <Ionicons name="create-outline" size={TOOLTIP_UI.ACTION_GLYPH_SIZE} color={colors.primary} />
            </View>
          </Tooltip>
          <Tooltip
            openOn="longPress"
            onPress={onDelete}
            content={<Text style={styles.tooltipLabel}>{LABELS.DELETE}</Text>}
            accessibilityLabel={LABELS.DELETE_POST_ARIA}
          >
            <View style={[styles.actionIcon, styles.actionIconDanger]}>
              <Ionicons name="trash-outline" size={TOOLTIP_UI.ACTION_GLYPH_SIZE} color={colors.destructive} />
            </View>
          </Tooltip>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}>
          <Text style={[styles.badgeText, { color: badgeStyle.color }]}>{statusConfig.label}</Text>
        </View>
      </View>

      {publishedPlatforms.length > 0 ? (
        <View style={styles.platformsRow}>
          {publishedPlatforms.map((p) => (
            <View key={p.platform} style={styles.platformPill}>
              <Text style={styles.platformText}>{p.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tags.length > 0 ? (
        <View style={styles.tagsBlock}>
          <TagChips tags={tags} limit={APP_CONFIG.TAGS_DISPLAY_LIMIT_CARD} />
        </View>
      ) : null}

      <View style={styles.datesRow}>
        <View style={styles.dateCol}>
          <Text style={styles.dateLabel}>{LABELS.CREATED}</Text>
          <Text style={styles.dateValue}>{formatDateTime(createdAt)}</Text>
        </View>
        <View style={styles.dateCol}>
          <Text style={styles.dateLabel}>{LABELS.UPDATED}</Text>
          <Text style={styles.dateValue}>{formatDateTime(updatedAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.CARD,
      padding: SETTINGS_LAYOUT.CARD_PADDING,
      marginBottom: SETTINGS_LAYOUT.CARD_GAP,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.94 },
    header: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" },
    title: {
      flex: 1,
      fontSize: SETTINGS_LAYOUT.SECTION_TITLE_SIZE,
      fontWeight: SETTINGS_LAYOUT.SECTION_TITLE_WEIGHT,
      color: colors.foreground,
    },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 0 },
    actionIcon: {
      width: TOOLTIP_UI.ACTION_ICON_SIZE,
      height: TOOLTIP_UI.ACTION_ICON_SIZE,
      borderRadius: RADIUS.SM,
      alignItems: "center",
      justifyContent: "center",
    },
    actionIconEdit: { backgroundColor: `${colors.primary}12` },
    actionIconDanger: { backgroundColor: `${colors.destructive}12` },
    tooltipLabel: {
      fontSize: TOOLTIP_UI.FONT_SIZE,
      fontWeight: "500",
      color: colors.foreground,
      textAlign: "center",
    },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.FULL },
    badgeText: { fontSize: 11, fontWeight: "600" },
    platformsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
    platformPill: {
      backgroundColor: `${colors.positive}20`,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: RADIUS.FULL,
    },
    platformText: { fontSize: 11, color: colors.positive, fontWeight: "600" },
    tagsBlock: { marginTop: 10 },
    datesRow: { flexDirection: "row", gap: 12, marginTop: 12 },
    dateCol: { flex: 1 },
    dateLabel: { fontSize: 11, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.2 },
    dateValue: { fontSize: 14, color: colors.foreground, marginTop: 2 },
  });
