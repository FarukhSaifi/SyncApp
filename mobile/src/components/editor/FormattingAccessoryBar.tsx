import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { RADIUS } from "@constants/designTokens";
import { EDITOR_A11Y, EDITOR_FORMAT_TOOLS, EDITOR_UI, LABELS } from "@constants/messages";
import { useThemeColors } from "@contexts/ThemeContext";

interface FormattingAccessoryBarProps {
  onOpenBlockInserter: () => void;
  onOpenAiStudio: () => void;
  onFormat: (prefix: string, suffix?: string, defaultText?: string) => void;
}

interface FormatTool {
  id: string;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  prefix: string;
  suffix?: string;
  defaultText?: string;
  tooltip: string;
}

const TOOLS: FormatTool[] = [
  {
    id: "bold",
    label: EDITOR_FORMAT_TOOLS.bold.label,
    prefix: "**",
    suffix: "**",
    defaultText: EDITOR_FORMAT_TOOLS.bold.defaultText,
    tooltip: EDITOR_FORMAT_TOOLS.bold.tooltip,
  },
  {
    id: "italic",
    label: EDITOR_FORMAT_TOOLS.italic.label,
    prefix: "*",
    suffix: "*",
    defaultText: EDITOR_FORMAT_TOOLS.italic.defaultText,
    tooltip: EDITOR_FORMAT_TOOLS.italic.tooltip,
  },
  {
    id: "h1",
    label: EDITOR_FORMAT_TOOLS.h1.label,
    prefix: "# ",
    suffix: "\n",
    defaultText: EDITOR_FORMAT_TOOLS.h1.defaultText,
    tooltip: EDITOR_FORMAT_TOOLS.h1.tooltip,
  },
  {
    id: "h2",
    label: EDITOR_FORMAT_TOOLS.h2.label,
    prefix: "## ",
    suffix: "\n",
    defaultText: EDITOR_FORMAT_TOOLS.h2.defaultText,
    tooltip: EDITOR_FORMAT_TOOLS.h2.tooltip,
  },
  {
    id: "bullet",
    icon: "list-outline",
    prefix: "- ",
    defaultText: EDITOR_FORMAT_TOOLS.bullet.defaultText,
    tooltip: EDITOR_FORMAT_TOOLS.bullet.tooltip,
  },
  {
    id: "check",
    icon: "checkbox-outline",
    prefix: "- [ ] ",
    defaultText: EDITOR_FORMAT_TOOLS.check.defaultText,
    tooltip: EDITOR_FORMAT_TOOLS.check.tooltip,
  },
  {
    id: "quote",
    icon: "chatbox-ellipses-outline",
    prefix: "> ",
    defaultText: EDITOR_FORMAT_TOOLS.quote.defaultText,
    tooltip: EDITOR_FORMAT_TOOLS.quote.tooltip,
  },
  {
    id: "code",
    icon: "code-slash-outline",
    prefix: "```\n",
    suffix: "\n```\n",
    defaultText: EDITOR_FORMAT_TOOLS.code.defaultText,
    tooltip: EDITOR_FORMAT_TOOLS.code.tooltip,
  },
  {
    id: "link",
    icon: "link-outline",
    prefix: "[",
    suffix: "](https://...)",
    defaultText: EDITOR_FORMAT_TOOLS.link.defaultText,
    tooltip: EDITOR_FORMAT_TOOLS.link.tooltip,
  },
];

export function FormattingAccessoryBar({
  onOpenBlockInserter,
  onOpenAiStudio,
  onFormat,
}: FormattingAccessoryBarProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* Prominent + Block Inserter Button */}
      <Pressable
        style={({ pressed }) => [styles.addBlockButton, pressed && styles.pressed]}
        onPress={onOpenBlockInserter}
        accessibilityLabel={EDITOR_A11Y.INSERT_BLOCK}
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={styles.addBlockText}>{EDITOR_UI.FORMAT_BLOCK}</Text>
      </Pressable>

      <View style={styles.divider} />

      {/* Formatting Tools List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolsScroll}
      >
        {TOOLS.map((tool) => (
          <Pressable
            key={tool.id}
            style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}
            onPress={() => onFormat(tool.prefix, tool.suffix, tool.defaultText)}
            accessibilityLabel={tool.tooltip}
          >
            {tool.icon ? (
              <Ionicons name={tool.icon} size={16} color={colors.foreground} />
            ) : (
              <Text
                style={[
                  styles.toolText,
                  tool.id === "bold" && styles.boldText,
                  tool.id === "italic" && styles.italicText,
                ]}
              >
                {tool.label}
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.divider} />

      {/* AI Studio Trigger */}
      <Pressable
        style={({ pressed }) => [styles.aiButton, pressed && styles.pressed]}
        onPress={onOpenAiStudio}
        accessibilityLabel={EDITOR_A11Y.OPEN_AI_STUDIO}
      >
        <Ionicons name="sparkles" size={15} color={colors.primary} />
        <Text style={styles.aiButtonText}>{LABELS.AI_SECTION}</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    addBlockButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: RADIUS.SM,
      gap: 3,
    },
    addBlockText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },
    divider: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
      marginHorizontal: 6,
    },
    toolsScroll: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingRight: 4,
    },
    toolButton: {
      minWidth: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: RADIUS.SM,
      backgroundColor: colors.secondary,
      paddingHorizontal: 6,
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.95 }],
    },
    toolText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
    },
    boldText: {
      fontWeight: "900",
    },
    italicText: {
      fontStyle: "italic",
    },
    aiButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: RADIUS.SM,
      backgroundColor: `${colors.primary}18`,
      borderWidth: 1,
      borderColor: `${colors.primary}40`,
      gap: 4,
    },
    aiButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
  });
