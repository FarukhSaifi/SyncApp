import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@components/Card";
import { Input } from "@components/Input";
import { RADIUS } from "@constants/designTokens";
import {
  EDITOR_A11Y,
  EDITOR_UI,
  LABELS,
  PLACEHOLDERS,
  editorMetaCharCount,
} from "@constants/messages";
import { useThemeColors } from "@contexts/ThemeContext";
import type { EditorForm } from "@types";

interface DetailsTabProps {
  form: EditorForm;
  updateField: <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => void;
}

export function DetailsTab({ form, updateField }: DetailsTabProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [newTagInput, setNewTagInput] = useState("");
  const [showAdvancedSeo, setShowAdvancedSeo] = useState(Boolean(form.canonical_url));

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, "");
    if (!trimmed) return;
    if (!form.tags.includes(trimmed)) {
      updateField("tags", [...form.tags, trimmed]);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateField(
      "tags",
      form.tags.filter((t) => t !== tagToRemove),
    );
  };

  // Quick schedule presets
  const handleSetPresetSchedule = (hoursFromNow: number) => {
    const scheduledDate = dayjs().add(hoursFromNow, "hour").toISOString();
    updateField("scheduled_for", scheduledDate);
  };

  const handleClearSchedule = () => {
    updateField("scheduled_for", "");
  };

  const metaLength = form.meta_description.length;

  return (
    <View style={styles.container}>
      {/* 1. Tags & Taxonomy */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="pricetags-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>{EDITOR_UI.TAGS_AND_TOPICS}</Text>
        </View>
        <Text style={styles.cardSub}>{EDITOR_UI.TAGS_AND_TOPICS_SUB}</Text>

        {/* Existing Tags Chips */}
        <View style={styles.tagsContainer}>
          {form.tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag}</Text>
              <Pressable
                onPress={() => handleRemoveTag(tag)}
                hitSlop={6}
                accessibilityLabel={EDITOR_A11Y.REMOVE_TAG(tag)}
              >
                <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Add Tag Input */}
        <View style={styles.addTagRow}>
          <TextInput
            style={styles.addTagInput}
            value={newTagInput}
            onChangeText={setNewTagInput}
            onSubmitEditing={handleAddTag}
            placeholder={PLACEHOLDERS.EDITOR_TAG}
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="done"
          />
          <Pressable
            style={({ pressed }) => [
              styles.addTagButton,
              !newTagInput.trim() && styles.addTagButtonDisabled,
              pressed && styles.pressed,
            ]}
            onPress={handleAddTag}
            disabled={!newTagInput.trim()}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addTagButtonText}>{LABELS.ADD}</Text>
          </Pressable>
        </View>
      </Card>

      {/* 2. Schedule Delivery */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>{EDITOR_UI.SCHEDULED_DELIVERY}</Text>
        </View>
        <Text style={styles.cardSub}>{EDITOR_UI.SCHEDULED_DELIVERY_SUB}</Text>

        {form.scheduled_for ? (
          <View style={styles.activeScheduleBox}>
            <View style={styles.scheduleInfo}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <View>
                <Text style={styles.scheduleDate}>
                  {dayjs(form.scheduled_for).format("MMM D, YYYY [at] h:mm A")}
                </Text>
                <Text style={styles.scheduleRelative}>{EDITOR_UI.SCHEDULED_FUTURE_NOTE}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleClearSchedule}
              style={styles.clearScheduleButton}
              accessibilityLabel={EDITOR_A11Y.CLEAR_SCHEDULE}
            >
              <Text style={styles.clearScheduleText}>{EDITOR_UI.PUBLISH_NOW_INSTEAD}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.presetsWrapper}>
            <Text style={styles.presetHeading}>{EDITOR_UI.QUICK_SCHEDULE_PRESETS}</Text>
            <View style={styles.presetButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.presetButton, pressed && styles.pressed]}
                onPress={() => handleSetPresetSchedule(4)}
              >
                <Ionicons name="sunny-outline" size={15} color={colors.foreground} />
                <Text style={styles.presetButtonText}>{EDITOR_UI.PRESET_IN_4_HOURS}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.presetButton, pressed && styles.pressed]}
                onPress={() => handleSetPresetSchedule(16)}
              >
                <Ionicons name="moon-outline" size={15} color={colors.foreground} />
                <Text style={styles.presetButtonText}>{EDITOR_UI.PRESET_TOMORROW_AM}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.presetButton, pressed && styles.pressed]}
                onPress={() => handleSetPresetSchedule(72)}
              >
                <Ionicons name="calendar-outline" size={15} color={colors.foreground} />
                <Text style={styles.presetButtonText}>{EDITOR_UI.PRESET_IN_3_DAYS}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Card>

      {/* 3. SEO & Search Engine Optimization */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="search-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>{EDITOR_UI.SEARCH_SOCIAL_PREVIEWS}</Text>
        </View>

        <Input
          label={EDITOR_UI.META_DESCRIPTION_LABEL}
          value={form.meta_description}
          onChangeText={(val) => updateField("meta_description", val)}
          multiline
          placeholder={PLACEHOLDERS.EDITOR_META}
          style={styles.metaInput}
        />
        <View style={styles.metaFooter}>
          <Text
            style={[
              styles.metaCounter,
              metaLength > 160 && styles.metaCounterWarning,
            ]}
          >
            {editorMetaCharCount(metaLength)}
          </Text>
        </View>

        {/* Collapsible Canonical URL */}
        <Pressable
          style={styles.advancedToggle}
          onPress={() => setShowAdvancedSeo((prev) => !prev)}
        >
          <Text style={styles.advancedToggleText}>{EDITOR_UI.ADVANCED_SEO_TOGGLE}</Text>
          <Ionicons
            name={showAdvancedSeo ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>

        {showAdvancedSeo ? (
          <View style={styles.advancedBox}>
            <Input
              label={LABELS.CANONICAL}
              value={form.canonical_url}
              onChangeText={(val) => updateField("canonical_url", val)}
              autoCapitalize="none"
              placeholder={PLACEHOLDERS.EDITOR_CANONICAL}
            />
            <Text style={styles.canonicalHint}>{EDITOR_UI.CANONICAL_HINT}</Text>
          </View>
        ) : null}
      </Card>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      gap: 14,
      paddingBottom: 24,
    },
    card: {
      padding: 16,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
    },
    cardSub: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginBottom: 14,
      lineHeight: 17,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    tagChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${colors.primary}15`,
      borderRadius: RADIUS.FULL,
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 6,
      borderWidth: 1,
      borderColor: `${colors.primary}35`,
    },
    tagText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    addTagRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    addTagInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: RADIUS.MD,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: colors.foreground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    addTagButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: RADIUS.MD,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 4,
    },
    addTagButtonDisabled: {
      opacity: 0.5,
    },
    addTagButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.98 }],
    },
    activeScheduleBox: {
      backgroundColor: colors.background,
      borderRadius: RADIUS.MD,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 12,
    },
    scheduleInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    scheduleDate: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
    },
    scheduleRelative: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    clearScheduleButton: {
      alignSelf: "flex-start",
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: RADIUS.SM,
      backgroundColor: colors.secondary,
    },
    clearScheduleText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.primary,
    },
    presetsWrapper: {
      gap: 8,
    },
    presetHeading: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.mutedForeground,
      letterSpacing: 0.8,
    },
    presetButtonsRow: {
      flexDirection: "row",
      gap: 8,
    },
    presetButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: RADIUS.MD,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 6,
    },
    presetButtonText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.foreground,
    },
    metaInput: {
      minHeight: 70,
    },
    metaFooter: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 4,
      marginBottom: 12,
    },
    metaCounter: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
    metaCounterWarning: {
      color: colors.warning,
      fontWeight: "700",
    },
    advancedToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginTop: 4,
    },
    advancedToggleText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    advancedBox: {
      marginTop: 8,
      gap: 4,
    },
    canonicalHint: {
      fontSize: 11,
      color: colors.mutedForeground,
      lineHeight: 16,
      marginTop: -4,
    },
  });
