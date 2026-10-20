import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@components/Button";
import { Spinner } from "@components/Spinner";
import { BUTTON_VARIANTS, RADIUS } from "@constants/designTokens";
import { EDITOR_AI_PROMPTS, LABELS, PLACEHOLDERS } from "@constants/messages";
import { OPTIMIZATION_TARGETS, type OptimizationTarget } from "@constants/platforms";
import { useThemeColors } from "@contexts/ThemeContext";

interface AiCopilotSheetProps {
  visible: boolean;
  onClose: () => void;
  currentContent: string;
  onAcceptReplace: (newContent: string) => void;
  onAcceptAppend: (newContent: string) => void;
  onAiEdit: (action: string) => Promise<string | void>;
  onGeneratePost: (topic: string) => Promise<void>;
  aiLoading: boolean;
  aiTargetPlatforms: OptimizationTarget[];
  toggleAiTargetPlatform: (target: OptimizationTarget) => void;
}

const AI_PRESETS: Array<{
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  prompt: string;
}> = [
  {
    id: "clarity",
    label: LABELS.AI_IMPROVE_CLARITY,
    icon: "sparkles-outline",
    prompt: EDITOR_AI_PROMPTS.IMPROVE_CLARITY,
  },
  {
    id: "punchy",
    label: LABELS.AI_MAKE_PUNCHY,
    icon: "flash-outline",
    prompt: EDITOR_AI_PROMPTS.MAKE_PUNCHY,
  },
  {
    id: "professional",
    label: LABELS.AI_PROFESSIONAL_TONE,
    icon: "briefcase-outline",
    prompt: EDITOR_AI_PROMPTS.PROFESSIONAL_TONE,
  },
  {
    id: "grammar",
    label: LABELS.AI_FIX_GRAMMAR,
    icon: "checkmark-done-outline",
    prompt: EDITOR_AI_PROMPTS.FIX_GRAMMAR,
  },
  {
    id: "shorten",
    label: LABELS.AI_SHORTEN,
    icon: "contract-outline",
    prompt: EDITOR_AI_PROMPTS.SHORTEN,
  },
  {
    id: "expand",
    label: LABELS.AI_EXPAND,
    icon: "expand-outline",
    prompt: EDITOR_AI_PROMPTS.EXPAND,
  },
];

export function AiCopilotSheet({
  visible,
  onClose,
  currentContent,
  onAcceptReplace,
  onAcceptAppend,
  onAiEdit,
  onGeneratePost,
  aiLoading,
  aiTargetPlatforms,
  toggleAiTargetPlatform,
}: AiCopilotSheetProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [customPrompt, setCustomPrompt] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [proposedText, setProposedText] = useState<string | null>(null);

  const handleRunPreset = async (prompt: string) => {
    try {
      const result = await onAiEdit(prompt);
      if (typeof result === "string" && result.trim()) {
        setProposedText(result);
      }
    } catch {
      // Handled in parent toast
    }
  };

  const handleRunCustom = async () => {
    if (!customPrompt.trim()) return;
    await handleRunPreset(customPrompt.trim());
  };

  const handleGenerateFresh = async () => {
    if (!newTopic.trim()) return;
    await onGeneratePost(newTopic.trim());
    onClose();
  };

  const handleClose = () => {
    setProposedText(null);
    setCustomPrompt("");
    setNewTopic("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.title}>{LABELS.AI_COPILOT_TITLE}</Text>
                <Text style={styles.subtitle}>{LABELS.AI_COPILOT_SUBTITLE}</Text>
              </View>
            </View>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
            {/* If AI has proposed an edit: show Before / After Review Surface */}
            {proposedText ? (
              <View style={styles.reviewSurface}>
                <View style={styles.reviewBanner}>
                  <Ionicons name="git-compare-outline" size={18} color={colors.primary} />
                  <Text style={styles.reviewBannerTitle}>{LABELS.AI_REVIEW_CHANGES}</Text>
                </View>
                <Text style={styles.reviewNotice}>{LABELS.AI_REVIEW_NOTICE}</Text>

                <View style={styles.diffBox}>
                  <Text style={styles.diffLabel}>{LABELS.AI_PROPOSED_VERSION}</Text>
                  <ScrollView style={styles.diffScroll}>
                    <Text style={styles.diffContent}>{proposedText}</Text>
                  </ScrollView>
                </View>

                <View style={styles.reviewActions}>
                  <Button
                    title={LABELS.AI_ACCEPT_REPLACE}
                    onPress={() => {
                      onAcceptReplace(proposedText);
                      handleClose();
                    }}
                    style={styles.reviewButtonPrimary}
                  />
                  <Button
                    title={LABELS.AI_APPEND_STORY}
                    variant={BUTTON_VARIANTS.OUTLINE}
                    onPress={() => {
                      onAcceptAppend(proposedText);
                      handleClose();
                    }}
                    style={styles.reviewButtonSecondary}
                  />
                  <Button
                    title={LABELS.AI_DISCARD}
                    variant={BUTTON_VARIANTS.GHOST}
                    onPress={() => setProposedText(null)}
                    style={styles.reviewButtonGhost}
                  />
                </View>
              </View>
            ) : (
              <>
                {/* 1. Quick Presets */}
                <Text style={styles.sectionLabel}>{LABELS.AI_QUICK_ENHANCEMENTS}</Text>
                <View style={styles.presetsGrid}>
                  {AI_PRESETS.map((preset) => (
                    <Pressable
                      key={preset.id}
                      style={({ pressed }) => [styles.presetCard, pressed && styles.pressed]}
                      onPress={() => void handleRunPreset(preset.prompt)}
                      disabled={aiLoading}
                    >
                      <Ionicons name={preset.icon} size={18} color={colors.primary} />
                      <Text style={styles.presetLabel}>{preset.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* 2. Custom Instruction */}
                <Text style={styles.sectionLabel}>{LABELS.AI_CUSTOM_EDIT}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.customInput}
                    placeholder={PLACEHOLDERS.AI_CUSTOM_PROMPT}
                    placeholderTextColor={colors.mutedForeground}
                    value={customPrompt}
                    onChangeText={setCustomPrompt}
                    multiline
                  />
                  <Button
                    title={LABELS.AI_APPLY_EDIT}
                    size="sm"
                    onPress={() => void handleRunCustom()}
                    loading={aiLoading}
                    disabled={!customPrompt.trim() || aiLoading}
                    style={styles.customButton}
                  />
                </View>

                {/* 3. Full Story Generation */}
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>{LABELS.AI_GENERATE_DRAFT_SECTION}</Text>
                <Text style={styles.optimizeLabel}>{LABELS.OPTIMIZE_FOR}</Text>
                <View style={styles.optimizeRow}>
                  {(
                    [
                      { target: OPTIMIZATION_TARGETS.DEVTO, label: LABELS.OPTIMIZE_DEVTO },
                      { target: OPTIMIZATION_TARGETS.LINKEDIN, label: LABELS.OPTIMIZE_LINKEDIN },
                      { target: OPTIMIZATION_TARGETS.GOOGLE, label: LABELS.OPTIMIZE_GOOGLE },
                    ] as const
                  ).map(({ target, label }) => {
                    const selected = aiTargetPlatforms.includes(target);
                    return (
                      <Pressable
                        key={target}
                        onPress={() => toggleAiTargetPlatform(target)}
                        style={[styles.optimizeChip, selected && styles.optimizeChipActive]}
                      >
                        <Ionicons
                          name={selected ? "checkbox" : "square-outline"}
                          size={18}
                          color={selected ? colors.primary : colors.mutedForeground}
                        />
                        <Text style={[styles.optimizeChipText, selected && styles.optimizeChipTextActive]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.customInput}
                    placeholder={PLACEHOLDERS.AI_NEW_TOPIC}
                    placeholderTextColor={colors.mutedForeground}
                    value={newTopic}
                    onChangeText={setNewTopic}
                  />
                  <Button
                    title={LABELS.AI_CREATE_DRAFT}
                    variant={BUTTON_VARIANTS.OUTLINE}
                    size="sm"
                    onPress={() => void handleGenerateFresh()}
                    loading={aiLoading}
                    disabled={!newTopic.trim() || aiLoading}
                    style={styles.customButton}
                  />
                </View>
              </>
            )}

            {aiLoading ? (
              <View style={styles.loadingOverlay}>
                <Spinner size="lg" />
                <Text style={styles.loadingText}>{LABELS.AI_PROCESSING}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: RADIUS.XL,
      borderTopRightRadius: RADIUS.XL,
      maxHeight: "88%",
      paddingTop: 12,
      paddingBottom: 36,
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
      marginBottom: 16,
    },
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    aiBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
    },
    subtitle: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    contentScroll: {
      paddingHorizontal: 20,
    },
    contentContainer: {
      paddingBottom: 24,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.mutedForeground,
      letterSpacing: 0.6,
      marginBottom: 10,
      marginTop: 14,
    },
    presetsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    presetCard: {
      flexBasis: "48%",
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: RADIUS.MD,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 8,
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    presetLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.foreground,
      flex: 1,
    },
    inputWrapper: {
      backgroundColor: colors.background,
      borderRadius: RADIUS.MD,
      padding: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 10,
    },
    customInput: {
      fontSize: 14,
      color: colors.foreground,
      minHeight: 44,
      textAlignVertical: "top",
    },
    customButton: {
      alignSelf: "flex-end",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 18,
    },
    optimizeLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    optimizeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    optimizeChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: 40,
      paddingHorizontal: 12,
      borderRadius: RADIUS.MD,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    optimizeChipActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}18`,
    },
    optimizeChipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    optimizeChipTextActive: {
      color: colors.foreground,
    },
    reviewSurface: {
      backgroundColor: colors.background,
      borderRadius: RADIUS.LG,
      padding: 16,
      borderWidth: 1,
      borderColor: `${colors.primary}50`,
      gap: 12,
    },
    reviewBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    reviewBannerTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.primary,
    },
    reviewNotice: {
      fontSize: 12,
      color: colors.mutedForeground,
      lineHeight: 18,
    },
    diffBox: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.MD,
      padding: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      maxHeight: 220,
    },
    diffLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.mutedForeground,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    diffScroll: {
      maxHeight: 180,
    },
    diffContent: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.foreground,
    },
    reviewActions: {
      gap: 8,
      marginTop: 6,
    },
    reviewButtonPrimary: {},
    reviewButtonSecondary: {},
    reviewButtonGhost: {},
    loadingOverlay: {
      marginTop: 24,
      alignItems: "center",
      gap: 12,
      padding: 24,
    },
    loadingText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontWeight: "500",
    },
  });
