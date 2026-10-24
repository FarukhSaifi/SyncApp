import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EDITOR_SHEET, OVERLAY, RADIUS, SETTINGS_LAYOUT } from "@constants/designTokens";
import {
  EDITOR_A11Y,
  EDITOR_BLOCK_CATEGORIES,
  EDITOR_CONTENT_BLOCKS,
  EDITOR_UI,
} from "@constants/messages";
import { useThemeColors } from "@contexts/ThemeContext";
import type { BlockInserterSheetProps, ContentBlockDef } from "@types";

const BLOCK_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  h1: "text",
  h2: "text-outline",
  h3: "text-outline",
  paragraph: "reader-outline",
  quote: "chatbox-ellipses-outline",
  callout: "bulb-outline",
  divider: "remove-outline",
  "bullet-list": "list-outline",
  "numbered-list": "list-circle-outline",
  checklist: "checkbox-outline",
  "code-block": "code-slash-outline",
  table: "grid-outline",
  image: "image-outline",
  link: "link-outline",
};

const CONTENT_BLOCKS: ContentBlockDef[] = EDITOR_CONTENT_BLOCKS.map((block) => ({
  ...block,
  icon: BLOCK_ICONS[block.id] ?? "document-outline",
}));

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
              <Text style={styles.title}>{EDITOR_UI.INSERT_BLOCK_TITLE}</Text>
              <Text style={styles.subtitle}>{EDITOR_UI.INSERT_BLOCK_SUBTITLE}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel={EDITOR_A11Y.CLOSE_BLOCK_MENU}>
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
                <Text style={styles.aiShortcutTitle}>{EDITOR_UI.AI_IMAGE_SHORTCUT_TITLE}</Text>
                <Text style={styles.aiShortcutSub}>{EDITOR_UI.AI_IMAGE_SHORTCUT_SUB}</Text>
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
            {EDITOR_BLOCK_CATEGORIES.map((cat) => {
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
      backgroundColor: OVERLAY.SCRIM_STRONG,
      justifyContent: "flex-end",
    },
    sheet: {
      flex: 1,
      backgroundColor: colors.card,
      maxHeight: EDITOR_SHEET.MAX_HEIGHT,
      paddingTop: 8,
      paddingBottom: 24,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: EDITOR_SHEET.TITLE_BAR_HEIGHT,
      paddingHorizontal: SETTINGS_LAYOUT.PAGE_PADDING,
      marginBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
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
