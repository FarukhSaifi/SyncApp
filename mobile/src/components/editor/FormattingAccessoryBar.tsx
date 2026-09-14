import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

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
  { id: "bold", label: "B", prefix: "**", suffix: "**", defaultText: "bold text", tooltip: "Bold" },
  { id: "italic", label: "I", prefix: "*", suffix: "*", defaultText: "italic text", tooltip: "Italic" },
  { id: "h1", label: "H1", prefix: "# ", suffix: "\n", defaultText: "Heading 1", tooltip: "Heading 1" },
  { id: "h2", label: "H2", prefix: "## ", suffix: "\n", defaultText: "Heading 2", tooltip: "Heading 2" },
  { id: "bullet", icon: "list-outline", prefix: "- ", defaultText: "List item", tooltip: "Bullet list" },
  { id: "check", icon: "checkbox-outline", prefix: "- [ ] ", defaultText: "Task item", tooltip: "Checklist" },
  { id: "quote", icon: "chatbox-ellipses-outline", prefix: "> ", defaultText: "Quote", tooltip: "Blockquote" },
  { id: "code", icon: "code-slash-outline", prefix: "```\n", suffix: "\n```\n", defaultText: "code", tooltip: "Code block" },
  { id: "link", icon: "link-outline", prefix: "[", suffix: "](https://...)", defaultText: "link text", tooltip: "Link" },
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
        accessibilityLabel="Insert block"
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={styles.addBlockText}>Block</Text>
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
        accessibilityLabel="Open AI Studio"
      >
        <Ionicons name="sparkles" size={15} color={colors.primary} />
        <Text style={styles.aiButtonText}>AI</Text>
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
