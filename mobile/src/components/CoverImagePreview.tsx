import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ImageDataUrlPreview } from "@/src/components/ImageDataUrlPreview";
import { Skeleton } from "@/src/components/Skeleton";
import { LABELS } from "@/src/constants";
import { LAYOUT, RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { isSvgDataUrl } from "@/src/utils/imageDataUrl";

interface CoverImagePreviewProps {
  uri: string;
  onRemove?: () => void;
  onPress?: () => void;
}

export function CoverImagePreview({ uri, onRemove, onPress }: CoverImagePreviewProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(!isSvgDataUrl(uri));

  if (!uri.trim()) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{LABELS.COVER_PREVIEW}</Text>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.box, pressed && onPress && styles.pressed]}
      >
        {loading ? (
          <Skeleton
            width="100%"
            height={LAYOUT.COVER_PREVIEW_HEIGHT}
            borderRadius={RADIUS.LG}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <ImageDataUrlPreview
          uri={uri}
          style={styles.image}
          accessibilityLabel={LABELS.COVER_PREVIEW}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      </Pressable>
      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.removeBtn}>
          <Text style={styles.removeText}>{LABELS.REMOVE_COVER}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    wrap: { marginTop: 4, marginBottom: 8 },
    label: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.mutedForeground,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    box: {
      height: LAYOUT.COVER_PREVIEW_HEIGHT,
      borderRadius: RADIUS.LG,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: "hidden",
      backgroundColor: colors.muted,
    },
    pressed: { opacity: 0.92 },
    image: { width: "100%", height: "100%" },
    removeBtn: { marginTop: 8, alignSelf: "flex-start" },
    removeText: { fontSize: 15, color: colors.destructive, fontWeight: "500" },
  });
