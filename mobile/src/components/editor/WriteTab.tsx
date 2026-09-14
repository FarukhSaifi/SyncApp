import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/src/components/Card";
import { CoverImagePreview } from "@/src/components/CoverImagePreview";
import { Input } from "@/src/components/Input";
import { AiCopilotSheet } from "@/src/components/editor/AiCopilotSheet";
import { BlockInserterSheet } from "@/src/components/editor/BlockInserterSheet";
import { FormattingAccessoryBar } from "@/src/components/editor/FormattingAccessoryBar";
import { VisualBlockPreview } from "@/src/components/editor/VisualBlockPreview";
import { RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import type { EditorForm } from "@/src/types";

interface WriteTabProps {
  form: EditorForm;
  updateField: <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => void;
  openGenerateImage: () => void;
  aiEdit: (action: string) => Promise<string | void>;
  generatePost: (topic: string) => Promise<void>;
  aiLoading: boolean;
}

export function WriteTab({ form, updateField, openGenerateImage, aiEdit, generatePost, aiLoading }: WriteTabProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [viewMode, setViewMode] = useState<"canvas" | "preview">("canvas");
  const [blockInserterVisible, setBlockInserterVisible] = useState(false);
  const [aiStudioVisible, setAiStudioVisible] = useState(false);

  // Insert block template into content
  const handleInsertBlock = (template: string) => {
    const current = form.content_markdown.trim();
    const updated = current ? `${current}\n\n${template}` : template;
    updateField("content_markdown", updated);
  };

  // Format inline or wrap text
  const handleFormat = (prefix: string, suffix: string = "", defaultText: string = "text") => {
    const current = form.content_markdown;
    const addition = `${prefix}${defaultText}${suffix}`;
    const updated = current.trim() ? `${current}\n\n${addition}` : addition;
    updateField("content_markdown", updated);
  };

  // Checkbox toggle inside preview
  const handleToggleCheckbox = (lineIndex: number) => {
    const lines = form.content_markdown.split("\n");
    if (lines[lineIndex]) {
      const line = lines[lineIndex];
      if (line.includes("- [ ] ")) {
        lines[lineIndex] = line.replace("- [ ] ", "- [x] ");
      } else if (line.includes("- [x] ") || line.includes("- [X] ")) {
        lines[lineIndex] = line.replace(/- \[[xX]\] /, "- [ ] ");
      }
      updateField("content_markdown", lines.join("\n"));
    }
  };

  const wordCount = form.content_markdown.trim().split(/\s+/).filter(Boolean).length;

  return (
    <View style={styles.container}>
      {/* 1. Canvas vs. Live Preview Switcher */}
      <View style={styles.viewSwitcher}>
        <Pressable
          style={[styles.switchOption, viewMode === "canvas" && styles.switchOptionActive]}
          onPress={() => setViewMode("canvas")}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={viewMode === "canvas" ? colors.primary : colors.mutedForeground}
          />
          <Text style={[styles.switchText, viewMode === "canvas" && styles.switchTextActive]}>Canvas Editor</Text>
        </Pressable>

        <Pressable
          style={[styles.switchOption, viewMode === "preview" && styles.switchOptionActive]}
          onPress={() => setViewMode("preview")}
        >
          <Ionicons
            name="eye-outline"
            size={16}
            color={viewMode === "preview" ? colors.primary : colors.mutedForeground}
          />
          <Text style={[styles.switchText, viewMode === "preview" && styles.switchTextActive]}>
            Live Article Preview
          </Text>
        </Pressable>
      </View>

      {/* 2. Cover Image Preview / Inserter */}
      <CoverImagePreview
        uri={form.cover_image}
        onPress={openGenerateImage}
        onRemove={() => updateField("cover_image", "")}
      />

      {/* 3. Headline Field */}
      <Card style={styles.headlineCard}>
        <Input
          label="Headline"
          value={form.title}
          onChangeText={(val) => updateField("title", val)}
          placeholder="Catchy, high-impact story title..."
          style={styles.headlineInput}
          containerStyle={styles.headlineContainer}
        />
      </Card>

      {/* 4. Formatting Accessory Bar */}
      <FormattingAccessoryBar
        onOpenBlockInserter={() => setBlockInserterVisible(true)}
        onOpenAiStudio={() => setAiStudioVisible(true)}
        onFormat={handleFormat}
      />

      {/* 5. Main Canvas / Preview Area */}
      {viewMode === "canvas" ? (
        <Card style={styles.bodyCard}>
          <View style={styles.canvasHeader}>
            <Text style={styles.canvasLabel}>STORY BODY</Text>
            <Text style={styles.metricsLabel}>{wordCount} words • Markdown enabled</Text>
          </View>

          <TextInput
            style={styles.bodyInput}
            value={form.content_markdown}
            onChangeText={(val) => updateField("content_markdown", val)}
            multiline
            placeholder="Write freely, insert blocks (+ Block), or ask AI (✨ AI)..."
            placeholderTextColor={colors.mutedForeground}
            textAlignVertical="top"
          />
        </Card>
      ) : (
        <VisualBlockPreview
          title={form.title}
          markdown={form.content_markdown}
          coverImage={form.cover_image}
          onToggleCheckbox={handleToggleCheckbox}
        />
      )}

      {/* Block Inserter Bottom Sheet */}
      <BlockInserterSheet
        visible={blockInserterVisible}
        onClose={() => setBlockInserterVisible(false)}
        onSelectBlock={handleInsertBlock}
        onTriggerAiImage={openGenerateImage}
      />

      {/* AI Copilot Studio Bottom Sheet */}
      <AiCopilotSheet
        visible={aiStudioVisible}
        onClose={() => setAiStudioVisible(false)}
        currentContent={form.content_markdown}
        onAcceptReplace={(newContent) => updateField("content_markdown", newContent)}
        onAcceptAppend={(newContent) => {
          const updated = form.content_markdown.trim()
            ? `${form.content_markdown.trim()}\n\n${newContent}`
            : newContent;
          updateField("content_markdown", updated);
        }}
        onAiEdit={aiEdit}
        onGeneratePost={generatePost}
        aiLoading={aiLoading}
      />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      paddingBottom: 20,
    },
    viewSwitcher: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: 3,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 14,
      gap: 4,
    },
    switchOption: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      borderRadius: RADIUS.MD,
      gap: 6,
    },
    switchOptionActive: {
      backgroundColor: colors.background,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    switchText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    switchTextActive: {
      color: colors.foreground,
      fontWeight: "700",
    },
    headlineCard: {
      padding: 14,
      marginBottom: 12,
    },
    headlineContainer: {
      marginBottom: 0,
    },
    headlineInput: {
      fontSize: 18,
      fontWeight: "700",
    },
    bodyCard: {
      padding: 16,
      marginBottom: 16,
      minHeight: 260,
    },
    canvasHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingBottom: 8,
    },
    canvasLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.mutedForeground,
      letterSpacing: 0.8,
    },
    metricsLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
    bodyInput: {
      fontSize: 15,
      lineHeight: 24,
      color: colors.foreground,
      minHeight: 200,
    },
  });
