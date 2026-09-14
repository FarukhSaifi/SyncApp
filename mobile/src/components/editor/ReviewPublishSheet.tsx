import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/Button";
import { RADIUS } from "@/src/constants/designTokens";
import { PLATFORM_DISPLAY_NAMES, PLATFORMS, type PlatformSlug } from "@/src/constants/platforms";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import type { EditorForm, EditorReadiness } from "@/src/types";

interface ReviewPublishSheetProps {
  visible: boolean;
  form: EditorForm;
  readiness: EditorReadiness;
  connectedPlatforms: PlatformSlug[];
  selectedPlatforms: PlatformSlug[];
  togglePlatform: (platform: PlatformSlug) => void;
  onClose: () => void;
  onPublish: () => void;
  publishing: boolean;
}

export function ReviewPublishSheet({
  visible,
  form,
  readiness,
  connectedPlatforms,
  selectedPlatforms,
  togglePlatform,
  onClose,
  onPublish,
  publishing,
}: ReviewPublishSheetProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const availableTargetPlatforms = useMemo(
    () => (Object.values(PLATFORMS) as PlatformSlug[]).filter((p) => connectedPlatforms.includes(p)),
    [connectedPlatforms],
  );

  const channelCount = selectedPlatforms.length;
  const isReady = readiness.ready && channelCount > 0 && availableTargetPlatforms.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.sheetTitle}>Review & Publish</Text>
              <Text style={styles.sheetSubtitle}>Final pre-flight check before distribution</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close review sheet">
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {/* Story Summary Card */}
            <View style={styles.storySummaryCard}>
              {form.cover_image ? (
                <Image source={{ uri: form.cover_image }} style={styles.storyCover} resizeMode="cover" />
              ) : null}
              <View style={styles.storyCopy}>
                <Text style={styles.storyHeadline} numberOfLines={2}>
                  {form.title || "Untitled story"}
                </Text>
                <Text style={styles.storyMeta}>
                  {form.content_markdown.trim().split(/\s+/).filter(Boolean).length} words •{" "}
                  {form.scheduled_for
                    ? `Scheduled for ${dayjs(form.scheduled_for).format("MMM D, h:mm A")}`
                    : "Instant distribution"}
                </Text>
              </View>
            </View>

            {/* Readiness Checklist */}
            <Text style={styles.sectionLabel}>PRE-FLIGHT READINESS CHECKLIST</Text>
            <View style={styles.checklistCard}>
              {readiness.items.map((item) => {
                const isItemReady = item.tone === "ready";
                return (
                  <View key={item.id} style={styles.checkItemRow}>
                    <Ionicons
                      name={isItemReady ? "checkmark-circle" : "alert-circle-outline"}
                      size={20}
                      color={isItemReady ? colors.positive : colors.warning}
                    />
                    <View style={styles.checkItemCopy}>
                      <Text style={styles.checkItemLabel}>{item.label}</Text>
                      <Text style={styles.checkItemDetail}>{item.detail}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Target Channels */}
            <Text style={styles.sectionLabel}>TARGET CHANNELS ({channelCount})</Text>
            {availableTargetPlatforms.length === 0 ? (
              <View style={styles.noChannelsWarning}>
                <Ionicons name="warning-outline" size={20} color={colors.warning} />
                <Text style={styles.noChannelsWarningText}>
                  No publishing channels connected. Add your credentials in Settings to publish.
                </Text>
              </View>
            ) : (
              <View style={styles.channelsCard}>
                {availableTargetPlatforms.map((platform) => {
                  const name = PLATFORM_DISPLAY_NAMES[platform];
                  const selected = selectedPlatforms.includes(platform);
                  return (
                    <Pressable key={platform} style={styles.channelRow} onPress={() => togglePlatform(platform)}>
                      <View style={styles.channelInfo}>
                        <Text style={styles.channelName}>{name}</Text>
                        <Text style={styles.channelSub}>{selected ? "Will publish" : "Skipped"}</Text>
                      </View>
                      <Ionicons
                        name={selected ? "checkbox" : "square-outline"}
                        size={22}
                        color={selected ? colors.primary : colors.mutedForeground}
                      />
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Notice */}
            <View style={styles.noticeBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={styles.noticeText}>
                Your draft is automatically saved before broadcasting to all selected destinations.
              </Text>
            </View>
          </ScrollView>

          {/* Explicit Publish CTA */}
          <View style={styles.footer}>
            <Button
              title={
                form.scheduled_for
                  ? `Confirm Schedule to ${channelCount} Channel${channelCount === 1 ? "" : "s"}`
                  : `Publish to ${channelCount} Channel${channelCount === 1 ? "" : "s"} Now`
              }
              onPress={onPublish}
              loading={publishing}
              disabled={!isReady || publishing}
              style={styles.publishCTA}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: RADIUS.XL,
      borderTopRightRadius: RADIUS.XL,
      maxHeight: "90%",
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 12,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    sheetTitle: {
      fontSize: 19,
      fontWeight: "800",
      color: colors.foreground,
    },
    sheetSubtitle: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    scroll: {
      paddingHorizontal: 20,
    },
    scrollContent: {
      paddingBottom: 24,
      gap: 12,
    },
    storySummaryCard: {
      backgroundColor: colors.background,
      borderRadius: RADIUS.LG,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    storyCover: {
      width: "100%",
      height: 120,
    },
    storyCopy: {
      padding: 14,
    },
    storyHeadline: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 4,
    },
    storyMeta: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.mutedForeground,
      letterSpacing: 0.8,
      marginTop: 8,
    },
    checklistCard: {
      backgroundColor: colors.background,
      borderRadius: RADIUS.MD,
      padding: 12,
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    checkItemRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    checkItemCopy: {
      flex: 1,
    },
    checkItemLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
    },
    checkItemDetail: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 1,
    },
    noChannelsWarning: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: `${colors.warning}15`,
      borderRadius: RADIUS.MD,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.warning}40`,
      marginBottom: 16,
    },
    noChannelsWarningText: {
      flex: 1,
      fontSize: 13,
      color: colors.foreground,
      lineHeight: 18,
    },
    channelsCard: {
      backgroundColor: colors.background,
      borderRadius: RADIUS.MD,
      paddingHorizontal: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    channelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    channelInfo: {
      flex: 1,
    },
    channelName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
    },
    channelSub: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    noticeBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${colors.primary}12`,
      padding: 12,
      borderRadius: RADIUS.MD,
      gap: 10,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
    },
    noticeText: {
      flex: 1,
      fontSize: 12,
      color: colors.foreground,
      lineHeight: 17,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 32,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    publishCTA: {
      width: "100%",
    },
  });
