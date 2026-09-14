import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

export interface ContentBlockDef {
  id: string;
  category: "text" | "lists" | "code" | "media";
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  template: string;
  accent?: string;
}

const CONTENT_BLOCKS: ContentBlockDef[] = [
  // Text & Headings
  {
    id: "h1",
    category: "text",
    title: "Heading 1",
    description: "Main section header for large topics",
    icon: "text",
    template: "# Section Heading\n\n",
  },
  {
    id: "h2",
    category: "text",
    title: "Heading 2",
    description: "Sub-section header for structure",
    icon: "text-outline",
    template: "## Sub-heading\n\n",
  },
  {
    id: "h3",
    category: "text",
    title: "Heading 3",
    description: "Minor header for grouping points",
    icon: "text-outline",
    template: "### Topic Detail\n\n",
  },
  {
    id: "paragraph",
    category: "text",
    title: "Paragraph",
    description: "Standard body text block",
    icon: "reader-outline",
    template: "Write your thought or explanation here...\n\n",
  },
  {
    id: "quote",
    category: "text",
    title: "Pull Quote",
    description: "Highlighted quote or testimonial",
    icon: "chatbox-ellipses-outline",
    template: "> \"A key quote or thought from your story.\"\n\n",
  },
  {
    id: "callout",
    category: "text",
    title: "Callout Box",
    description: "Important callout with tip or notice",
    icon: "bulb-outline",
    template: "> **Tip:** Here is an actionable tip or note for your readers.\n\n",
  },
  {
    id: "divider",
    category: "text",
    title: "Divider",
    description: "Horizontal separator between sections",
    icon: "remove-outline",
    template: "---\n\n",
  },

  // Lists & Tasks
  {
    id: "bullet-list",
    category: "lists",
    title: "Bullet List",
    description: "Unordered list of points",
    icon: "list-outline",
    template: "- Key takeaway 1\n- Key takeaway 2\n- Key takeaway 3\n\n",
  },
  {
    id: "numbered-list",
    category: "lists",
    title: "Numbered List",
    description: "Step-by-step ordered sequence",
    icon: "list-circle-outline",
    template: "1. First step or phase\n2. Second step or phase\n3. Third step or phase\n\n",
  },
  {
    id: "checklist",
    category: "lists",
    title: "Task Checklist",
    description: "Interactive actionable items",
    icon: "checkbox-outline",
    template: "- [ ] Action item 1\n- [ ] Action item 2\n- [ ] Action item 3\n\n",
  },

  // Code & Technical
  {
    id: "code-block",
    category: "code",
    title: "Code Snippet",
    description: "Formatted syntax code block",
    icon: "code-slash-outline",
    template: "```typescript\n// Example implementation\nexport function example() {\n  return true;\n}\n```\n\n",
  },
  {
    id: "table",
    category: "code",
    title: "Comparison Table",
    description: "Structured rows and columns",
    icon: "grid-outline",
    template: "| Feature | Platform A | Platform B |\n| :--- | :--- | :--- |\n| Support | Yes | Yes |\n| Status | Active | In Progress |\n\n",
  },

  // Media
  {
    id: "image",
    category: "media",
    title: "Inline Image",
    description: "Embed markdown image link",
    icon: "image-outline",
    template: "![Image caption or description](https://example.com/image.png)\n\n",
  },
  {
    id: "link",
    category: "media",
    title: "Web Link",
    description: "Clickable hyperlink reference",
    icon: "link-outline",
    template: "[Read more here](https://your-domain.com)\n\n",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Blocks" },
  { id: "text", label: "Text" },
  { id: "lists", label: "Lists" },
  { id: "code", label: "Code & Data" },
  { id: "media", label: "Media & Links" },
] as const;

interface BlockInserterSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectBlock: (template: string) => void;
  onTriggerAiImage?: () => void;
}

export function BlockInserterSheet({
  visible,
  onClose,
  onSelectBlock,
  onTriggerAiImage,
}: BlockInserterSheetProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredBlocks = useMemo(() => {
    if (selectedCategory === "all") return CONTENT_BLOCKS;
    return CONTENT_BLOCKS.filter((b) => b.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Insert Content Block</Text>
              <Text style={styles.subtitle}>Choose a block to add to your story</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close block menu">
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Quick AI Image Shortcut */}
          {onTriggerAiImage ? (
            <Pressable
              style={styles.aiShortcut}
              onPress={() => {
                onClose();
                onTriggerAiImage();
              }}
            >
              <View style={styles.aiIconBadge}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.aiShortcutCopy}>
                <Text style={styles.aiShortcutTitle}>Generate AI Image / Cover</Text>
                <Text style={styles.aiShortcutSub}>Create stunning art with Gemini AI</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
            </Pressable>
          ) : null}

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}
                >
                  <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Block Items Grid */}
          <ScrollView style={styles.blockScroll} contentContainerStyle={styles.blockGrid}>
            {filteredBlocks.map((block) => (
              <Pressable
                key={block.id}
                style={({ pressed }) => [styles.blockCard, pressed && styles.blockCardPressed]}
                onPress={() => {
                  onSelectBlock(block.template);
                  onClose();
                }}
              >
                <View style={styles.blockIconWrapper}>
                  <Ionicons name={block.icon} size={22} color={colors.primary} />
                </View>
                <View style={styles.blockInfo}>
                  <Text style={styles.blockTitle}>{block.title}</Text>
                  <Text style={styles.blockDescription} numberOfLines={2}>
                    {block.description}
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={20} color={colors.mutedForeground} />
              </Pressable>
            ))}
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
      maxHeight: "84%",
      paddingTop: 12,
      paddingBottom: 32,
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
      marginBottom: 12,
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
    aiShortcut: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 12,
      borderRadius: RADIUS.MD,
      backgroundColor: `${colors.primary}15`,
      borderWidth: 1,
      borderColor: `${colors.primary}40`,
    },
    aiIconBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    aiShortcutCopy: {
      flex: 1,
    },
    aiShortcutTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
    },
    aiShortcutSub: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 1,
    },
    categoryScroll: {
      maxHeight: 38,
      marginBottom: 12,
    },
    categoryContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    categoryPill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: RADIUS.FULL,
      backgroundColor: colors.secondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    categoryPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryPillText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    categoryPillTextActive: {
      color: "#FFFFFF",
    },
    blockScroll: {
      paddingHorizontal: 16,
    },
    blockGrid: {
      gap: 10,
      paddingBottom: 20,
    },
    blockCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: RADIUS.MD,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    blockCardPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.99 }],
    },
    blockIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.SM,
      backgroundColor: `${colors.primary}18`,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    blockInfo: {
      flex: 1,
    },
    blockTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
    },
    blockDescription: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 2,
    },
  });
