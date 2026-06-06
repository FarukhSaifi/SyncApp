import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { ImageDataUrlPreview } from "@/src/components/ImageDataUrlPreview";
import { Skeleton } from "@/src/components/Skeleton";
import { Spinner } from "@/src/components/Spinner";
import { DESCRIPTIONS, LABELS } from "@/src/constants";
import { RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";

interface ImagePreviewFrameProps {
  generating: boolean;
  uri: string | null;
  emptyHint?: string;
  style?: StyleProp<ViewStyle>;
  minHeight?: number;
}

/**
 * Image preview area — web editor pattern: dashed primary box + spinner while generating,
 * then image preview with skeleton until bitmap loads.
 */
export function ImagePreviewFrame({
  generating,
  uri,
  emptyHint = LABELS.IMAGE_PREVIEW_EMPTY,
  style,
  minHeight = 220,
}: ImagePreviewFrameProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors, minHeight), [colors, minHeight]);

  if (generating) {
    return (
      <View style={[styles.frame, styles.generating, style]} accessibilityLabel={LABELS.GENERATING_IMAGE}>
        <Skeleton width="100%" height={minHeight} borderRadius={RADIUS.LG} style={StyleSheet.absoluteFill} />
        <View style={styles.generatingContent}>
          <Spinner size="md" />
          <Text style={styles.generatingTitle}>{LABELS.GENERATING_IMAGE}</Text>
          <Text style={styles.generatingHint}>{DESCRIPTIONS.GENERATING_IMAGE_HINT}</Text>
        </View>
      </View>
    );
  }

  if (!uri) {
    return (
      <View style={[styles.frame, styles.empty, style]}>
        <Ionicons name="image-outline" size={40} color={colors.mutedForeground} />
        <Text style={styles.emptyText}>{emptyHint}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.frame, styles.preview, style]}>
      <ImageDataUrlPreview uri={uri} style={styles.previewImage} accessibilityLabel={LABELS.IMAGE_PREVIEW} />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>, minHeight: number) =>
  StyleSheet.create({
    frame: {
      minHeight,
      borderRadius: RADIUS.LG,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    generating: {
      borderStyle: "dashed",
      borderColor: `${colors.primary}66`,
      backgroundColor: `${colors.primary}14`,
      justifyContent: "center",
      alignItems: "center",
    },
    generatingContent: {
      alignItems: "center",
      padding: 24,
      gap: 10,
      zIndex: 1,
    },
    generatingTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      textAlign: "center",
    },
    generatingHint: {
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: "center",
      maxWidth: 240,
      lineHeight: 18,
    },
    empty: {
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: 24,
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    preview: {
      backgroundColor: colors.card,
    },
    previewImage: { width: "100%", height: minHeight },
  });
