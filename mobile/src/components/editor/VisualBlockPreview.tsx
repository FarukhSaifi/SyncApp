import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

interface VisualBlockPreviewProps {
  title: string;
  markdown: string;
  coverImage?: string;
  onToggleCheckbox?: (lineIndex: number) => void;
}

type ParsedBlock =
  | { type: "h1"; text: string; id: string }
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string; id: string }
  | { type: "quote"; text: string; id: string }
  | { type: "code"; code: string; lang: string; id: string }
  | { type: "bullet"; text: string; id: string }
  | { type: "numbered"; num: string; text: string; id: string }
  | { type: "checklist"; checked: boolean; text: string; lineIndex: number; id: string }
  | { type: "divider"; id: string }
  | { type: "image"; alt: string; url: string; id: string }
  | { type: "paragraph"; text: string; id: string };

function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  if (!markdown.trim()) return [];

  const lines = markdown.split("\n");
  const blocks: ParsedBlock[] = [];
  let inCode = false;
  let codeLang = "";
  let codeBuffer: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Code block fences
    if (trimmed.startsWith("```")) {
      if (inCode) {
        blocks.push({
          type: "code",
          code: codeBuffer.join("\n"),
          lang: codeLang || "text",
          id: `code-${index}`,
        });
        inCode = false;
        codeBuffer = [];
        codeLang = "";
      } else {
        inCode = true;
        codeLang = trimmed.replace("```", "").trim();
        codeBuffer = [];
      }
      return;
    }

    if (inCode) {
      codeBuffer.push(line);
      return;
    }

    if (!trimmed) return;

    // Headings
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4), id: `h3-${index}` });
    } else if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3), id: `h2-${index}` });
    } else if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", text: trimmed.slice(2), id: `h1-${index}` });
    }
    // Blockquote
    else if (trimmed.startsWith("> ")) {
      blocks.push({ type: "quote", text: trimmed.slice(2), id: `q-${index}` });
    }
    // Divider
    else if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      blocks.push({ type: "divider", id: `div-${index}` });
    }
    // Checklists
    else if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ")) {
      const checked = trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ");
      blocks.push({
        type: "checklist",
        checked,
        text: trimmed.slice(6),
        lineIndex: index,
        id: `chk-${index}`,
      });
    }
    // Bullet list
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      blocks.push({ type: "bullet", text: trimmed.slice(2), id: `ul-${index}` });
    }
    // Numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        blocks.push({ type: "numbered", num: match[1], text: match[2], id: `ol-${index}` });
      } else {
        blocks.push({ type: "paragraph", text: trimmed, id: `p-${index}` });
      }
    }
    // Image ![alt](url)
    else if (/^!\[(.*?)\]\((.*?)\)$/.test(trimmed)) {
      const match = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match) {
        blocks.push({ type: "image", alt: match[1], url: match[2], id: `img-${index}` });
      } else {
        blocks.push({ type: "paragraph", text: trimmed, id: `p-${index}` });
      }
    }
    // Paragraph
    else {
      blocks.push({ type: "paragraph", text: line, id: `p-${index}` });
    }
  });

  if (inCode && codeBuffer.length > 0) {
    blocks.push({
      type: "code",
      code: codeBuffer.join("\n"),
      lang: codeLang || "text",
      id: `code-end`,
    });
  }

  return blocks;
}

export function VisualBlockPreview({ title, markdown, coverImage, onToggleCheckbox }: VisualBlockPreviewProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const blocks = useMemo(() => parseMarkdownToBlocks(markdown), [markdown]);

  if (!title && blocks.length === 0 && !coverImage) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={44} color={colors.mutedForeground} />
        <Text style={styles.emptyTitle}>Live Article Preview</Text>
        <Text style={styles.emptySub}>
          Write in the canvas or insert blocks to see your rendered post formatted here in real time.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cover Image */}
      {coverImage ? (
        <View style={styles.coverWrapper}>
          <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />
        </View>
      ) : null}

      {/* Article Title */}
      {title ? (
        <View style={styles.titleWrapper}>
          <Text style={styles.articleTitle}>{title}</Text>
          <View style={styles.titleDivider} />
        </View>
      ) : null}

      {/* Rendered Content Blocks */}
      {blocks.map((block) => {
        switch (block.type) {
          case "h1":
            return (
              <View key={block.id} style={styles.h1Wrapper}>
                <Text style={styles.h1}>{block.text}</Text>
              </View>
            );

          case "h2":
            return (
              <View key={block.id} style={styles.h2Wrapper}>
                <Text style={styles.h2}>{block.text}</Text>
              </View>
            );

          case "h3":
            return (
              <View key={block.id} style={styles.h3Wrapper}>
                <Text style={styles.h3}>{block.text}</Text>
              </View>
            );

          case "quote":
            return (
              <View key={block.id} style={styles.quoteCard}>
                <Ionicons name="chatbox-ellipses" size={16} color={colors.primary} style={styles.quoteIcon} />
                <Text style={styles.quoteText}>{block.text}</Text>
              </View>
            );

          case "code":
            return (
              <View key={block.id} style={styles.codeCard}>
                <View style={styles.codeHeader}>
                  <Text style={styles.codeLang}>{block.lang.toUpperCase()}</Text>
                </View>
                <Text style={styles.codeText}>{block.code}</Text>
              </View>
            );

          case "bullet":
            return (
              <View key={block.id} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{block.text}</Text>
              </View>
            );

          case "numbered":
            return (
              <View key={block.id} style={styles.numberedRow}>
                <View style={styles.numberedBadge}>
                  <Text style={styles.numberedText}>{block.num}</Text>
                </View>
                <Text style={styles.bulletText}>{block.text}</Text>
              </View>
            );

          case "checklist":
            return (
              <Pressable key={block.id} style={styles.checkRow} onPress={() => onToggleCheckbox?.(block.lineIndex)}>
                <Ionicons
                  name={block.checked ? "checkbox" : "square-outline"}
                  size={20}
                  color={block.checked ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.checkText, block.checked && styles.checkTextDone]}>{block.text}</Text>
              </Pressable>
            );

          case "divider":
            return <View key={block.id} style={styles.divider} />;

          case "image":
            return (
              <View key={block.id} style={styles.inlineImageWrapper}>
                <Image source={{ uri: block.url }} style={styles.inlineImage} resizeMode="cover" />
                {block.alt ? <Text style={styles.imageCaption}>{block.alt}</Text> : null}
              </View>
            );

          case "paragraph":
          default:
            return (
              <Text key={block.id} style={styles.paragraph}>
                {block.text}
              </Text>
            );
        }
      })}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 16,
    },
    emptyContainer: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: 32,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      marginTop: 12,
    },
    emptySub: {
      fontSize: 13,
      color: colors.mutedForeground,
      textAlign: "center",
      marginTop: 6,
      lineHeight: 18,
    },
    coverWrapper: {
      height: 180,
      borderRadius: RADIUS.MD,
      overflow: "hidden",
      marginBottom: 16,
    },
    coverImage: {
      width: "100%",
      height: "100%",
    },
    titleWrapper: {
      marginBottom: 16,
    },
    articleTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.3,
      lineHeight: 32,
    },
    titleDivider: {
      height: 2,
      width: 48,
      backgroundColor: colors.primary,
      marginTop: 12,
      borderRadius: 1,
    },
    h1Wrapper: {
      marginTop: 18,
      marginBottom: 8,
    },
    h1: {
      fontSize: 21,
      fontWeight: "800",
      color: colors.foreground,
      lineHeight: 28,
    },
    h2Wrapper: {
      marginTop: 16,
      marginBottom: 6,
    },
    h2: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      lineHeight: 24,
    },
    h3Wrapper: {
      marginTop: 12,
      marginBottom: 4,
    },
    h3: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      lineHeight: 20,
    },
    paragraph: {
      fontSize: 15,
      lineHeight: 23,
      color: colors.foreground,
      marginBottom: 12,
    },
    quoteCard: {
      flexDirection: "row",
      backgroundColor: `${colors.primary}10`,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      borderRadius: RADIUS.SM,
      padding: 12,
      marginVertical: 10,
      alignItems: "flex-start",
    },
    quoteIcon: {
      marginRight: 8,
      marginTop: 2,
    },
    quoteText: {
      flex: 1,
      fontSize: 14,
      fontStyle: "italic",
      lineHeight: 21,
      color: colors.foreground,
    },
    codeCard: {
      backgroundColor: "#16181D",
      borderRadius: RADIUS.MD,
      padding: 12,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: "#262B35",
    },
    codeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#333A48",
      paddingBottom: 6,
      marginBottom: 8,
    },
    codeLang: {
      fontSize: 10,
      fontWeight: "700",
      color: "#8B949E",
      letterSpacing: 0.5,
    },
    codeText: {
      fontFamily: "Courier",
      fontSize: 12,
      color: "#E6EDF3",
      lineHeight: 18,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
      paddingLeft: 4,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 8,
      marginRight: 10,
    },
    bulletText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      color: colors.foreground,
    },
    numberedRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
      paddingLeft: 2,
    },
    numberedBadge: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: `${colors.primary}20`,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
      marginRight: 8,
    },
    numberedText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primary,
    },
    checkRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      paddingLeft: 2,
      gap: 8,
    },
    checkText: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 20,
    },
    checkTextDone: {
      textDecorationLine: "line-through",
      color: colors.mutedForeground,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    inlineImageWrapper: {
      borderRadius: RADIUS.MD,
      overflow: "hidden",
      marginVertical: 12,
    },
    inlineImage: {
      width: "100%",
      height: 190,
    },
    imageCaption: {
      fontSize: 11,
      color: colors.mutedForeground,
      textAlign: "center",
      marginTop: 6,
    },
  });
