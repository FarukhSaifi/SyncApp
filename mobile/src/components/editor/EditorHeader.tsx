import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { RADIUS } from "@constants/designTokens";
import { ALERTS, EDITOR_A11Y, EDITOR_UI, editorReadinessBadge, editorWordsReadTime } from "@constants/messages";
import { useThemeColors } from "@contexts/ThemeContext";
import type { EditorHeaderProps } from "@types";

export function EditorHeader({
  title,
  wordCount,
  saving,
  isDirty,
  readiness,
  onOpenReview,
}: EditorHeaderProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const handleBack = () => {
    if (isDirty) {
      Alert.alert(ALERTS.UNSAVED_CHANGES_TITLE, ALERTS.UNSAVED_CHANGES_MESSAGE, [
        { text: ALERTS.KEEP_EDITING, style: "cancel" },
        { text: ALERTS.DISCARD_AND_EXIT, style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.header}>
      {/* Top Row: Navigation + Actions */}
      <View style={styles.topRow}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={handleBack}
          accessibilityLabel={EDITOR_A11Y.BACK_TO_POSTS}
        >
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.statsRow}>
          {/* Word Count & Read Time Pill */}
          <View style={styles.statPill}>
            <Text style={styles.statText}>
              {editorWordsReadTime(wordCount, readTimeMin)}
            </Text>
          </View>

          {/* Readiness Score Badge */}
          <Pressable
            style={({ pressed }) => [styles.readinessPill, pressed && styles.pressed]}
            onPress={onOpenReview}
          >
            <View
              style={[
                styles.readinessDot,
                { backgroundColor: readiness.ready ? colors.positive : colors.warning },
              ]}
            />
            <Text style={styles.readinessText}>
              {editorReadinessBadge(readiness.completed, readiness.total)}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Bottom Row: Title + Save State */}
      <View style={styles.titleRow}>
        <View style={styles.titleInfo}>
          <Text style={styles.eyebrow}>{EDITOR_UI.CONTENT_WORKSPACE}</Text>
          <Text style={styles.headline} numberOfLines={1}>
            {title.trim() || EDITOR_UI.UNTITLED_STORY}
          </Text>
        </View>

        <View style={styles.saveState}>
          <View
            style={[
              styles.saveDot,
              { backgroundColor: saving ? colors.warning : colors.positive },
            ]}
          />
          <Text style={styles.saveText}>
            {saving ? EDITOR_UI.SAVING : EDITOR_UI.SAVED}
          </Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.FULL,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.96 }],
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    statPill: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: RADIUS.FULL,
    },
    statText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    readinessPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${colors.primary}15`,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: RADIUS.FULL,
      gap: 6,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
    },
    readinessDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    readinessText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    titleInfo: {
      flex: 1,
      marginRight: 12,
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.8,
      color: colors.primary,
      marginBottom: 2,
    },
    headline: {
      fontSize: 19,
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.3,
    },
    saveState: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingBottom: 2,
    },
    saveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    saveText: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontWeight: "500",
    },
  });
