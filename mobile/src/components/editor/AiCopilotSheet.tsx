import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Spinner } from "@/src/components/Spinner";
import { BUTTON_VARIANTS, RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

interface AiCopilotSheetProps {
  visible: boolean;
  onClose: () => void;
  currentContent: string;
  onAcceptReplace: (newContent: string) => void;
  onAcceptAppend: (newContent: string) => void;
  onAiEdit: (action: string) => Promise<string | void>;
  onGeneratePost: (topic: string) => Promise<void>;
  aiLoading: boolean;
}

const AI_PRESETS = [
  { id: "clarity", label: "Improve clarity", icon: "sparkles-outline", prompt: "improve clarity" },
  { id: "punchy", label: "Make punchy & viral", icon: "flash-outline", prompt: "make it punchy and engaging" },
  { id: "professional", label: "Professional tone", icon: "briefcase-outline", prompt: "adapt to professional tone" },
  { id: "grammar", label: "Fix grammar & typos", icon: "checkmark-done-outline", prompt: "fix grammar and typos" },
  { id: "shorten", label: "Shorten & condense", icon: "contract-outline", prompt: "shorten and condense" },
  { id: "expand", label: "Expand with examples", icon: "expand-outline", prompt: "expand with actionable examples" },
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
                <Text style={styles.title}>AI Copilot Studio</Text>
                <Text style={styles.subtitle}>Refine your message or generate drafts</Text>
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
                  <Text style={styles.reviewBannerTitle}>Review AI Changes</Text>
                </View>
                <Text style={styles.reviewNotice}>
                  Review the proposed text before applying. Your existing draft will not be changed unless you confirm.
                </Text>

                <View style={styles.diffBox}>
                  <Text style={styles.diffLabel}>AI PROPOSED VERSION</Text>
                  <ScrollView style={styles.diffScroll}>
                    <Text style={styles.diffContent}>{proposedText}</Text>
                  </ScrollView>
                </View>

                <View style={styles.reviewActions}>
                  <Button
                    title="Accept & Replace"
                    onPress={() => {
                      onAcceptReplace(proposedText);
                      handleClose();
                    }}
                    style={styles.reviewButtonPrimary}
                  />
                  <Button
                    title="Append to Story"
                    variant={BUTTON_VARIANTS.OUTLINE}
                    onPress={() => {
                      onAcceptAppend(proposedText);
                      handleClose();
                    }}
                    style={styles.reviewButtonSecondary}
                  />
                  <Button
                    title="Discard"
                    variant={BUTTON_VARIANTS.GHOST}
                    onPress={() => setProposedText(null)}
                    style={styles.reviewButtonGhost}
                  />
                </View>
              </View>
            ) : (
              <>
                {/* 1. Quick Presets */}
                <Text style={styles.sectionLabel}>QUICK ENHANCEMENTS</Text>
                <View style={styles.presetsGrid}>
                  {AI_PRESETS.map((preset) => (
                    <Pressable
                      key={preset.id}
                      style={({ pressed }) => [styles.presetCard, pressed && styles.pressed]}
                      onPress={() => void handleRunPreset(preset.prompt)}
                      disabled={aiLoading}
                    >
                      <Ionicons name={preset.icon as any} size={18} color={colors.primary} />
                      <Text style={styles.presetLabel}>{preset.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* 2. Custom Instruction */}
                <Text style={styles.sectionLabel}>CUSTOM EDIT INSTRUCTION</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="e.g. Turn this into a Twitter thread intro..."
                    placeholderTextColor={colors.mutedForeground}
                    value={customPrompt}
                    onChangeText={setCustomPrompt}
                    multiline
                  />
                  <Button
                    title="Apply Edit"
                    size="sm"
                    onPress={() => void handleRunCustom()}
                    loading={aiLoading}
                    disabled={!customPrompt.trim() || aiLoading}
                    style={styles.customButton}
                  />
                </View>

                {/* 3. Full Story Generation */}
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>GENERATE FULL DRAFT FROM TOPIC</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Enter topic or angle for a fresh draft..."
                    placeholderTextColor={colors.mutedForeground}
                    value={newTopic}
                    onChangeText={setNewTopic}
                  />
                  <Button
                    title="Create Draft"
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
                <Text style={styles.loadingText}>Gemini AI is processing your content...</Text>
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
