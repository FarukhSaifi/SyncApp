import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/Button";
import { APP_CONFIG } from "@/src/constants/config";
import { BUTTON_VARIANTS, IOS26, RADIUS } from "@/src/constants/designTokens";
import { LABELS } from "@/src/constants/messages";
import { POST_STATUS, STATUS_CONFIG, getStatusBadgeStyle, type StatusTone } from "@/src/constants/postStatus";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import type { Post } from "@/src/types";
import { formatDateTime } from "@/src/utils/dateUtils";

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onDelete: () => void;
}

export function PostCard({ post, onPress, onDelete }: PostCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const statusKey = (post.status in STATUS_CONFIG ? post.status : POST_STATUS.DRAFT) as keyof typeof STATUS_CONFIG;
  const statusConfig = STATUS_CONFIG[statusKey];
  const badgeStyle = getStatusBadgeStyle(colors, statusConfig.tone as StatusTone);

  const createdAt = post.created_at || post.createdAt;
  const updatedAt = post.updated_at || post.updatedAt;
  const tags = post.tags ?? [];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <View style={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}>
          <Text style={[styles.badgeText, { color: badgeStyle.color }]}>{statusConfig.label}</Text>
        </View>
      </View>

      {tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.slice(0, APP_CONFIG.TAGS_DISPLAY_LIMIT_CARD).map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {tags.length > APP_CONFIG.TAGS_DISPLAY_LIMIT_CARD && (
            <Text style={styles.tagsMore}>+{tags.length - APP_CONFIG.TAGS_DISPLAY_LIMIT_CARD}</Text>
          )}
        </View>
      )}

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

      <View style={styles.actions}>
        <Button
          title={LABELS.EDIT}
          variant={BUTTON_VARIANTS.OUTLINE}
          size="sm"
          onPress={onPress}
          style={styles.actionBtn}
        />
        <Button
          title={LABELS.DELETE}
          variant={BUTTON_VARIANTS.OUTLINE}
          size="sm"
          onPress={onDelete}
          style={styles.actionBtn}
        />
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: 16,
      marginBottom: IOS26.GROUPED_GAP,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.94 },
    header: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" },
    title: { flex: 1, fontSize: 17, fontWeight: "600", color: colors.foreground },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.FULL },
    badgeText: { fontSize: 11, fontWeight: "600" },
    tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
    tagPill: {
      backgroundColor: `${colors.primary}26`,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: RADIUS.FULL,
    },
    tagText: { fontSize: 11, color: colors.primary, fontWeight: "500" },
    tagsMore: { fontSize: 11, color: colors.mutedForeground, alignSelf: "center" },
    datesRow: { flexDirection: "row", gap: 12, marginTop: 12 },
    dateCol: { flex: 1 },
    dateLabel: { fontSize: 11, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.2 },
    dateValue: { fontSize: 14, color: colors.foreground, marginTop: 2 },
    actions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    actionBtn: { flex: 1 },
  });
