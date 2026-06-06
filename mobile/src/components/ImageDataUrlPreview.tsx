import { useMemo, useState } from "react";
import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp } from "react-native";
import { SvgXml } from "react-native-svg";

import { Skeleton } from "@/src/components/Skeleton";
import { LABELS } from "@/src/constants";
import { RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { decodeSvgXmlFromDataUrl, isSvgDataUrl } from "@/src/utils/imageDataUrl";

interface ImageDataUrlPreviewProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function ImageDataUrlPreview({ uri, style, accessibilityLabel, onLoad, onError }: ImageDataUrlPreviewProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [failed, setFailed] = useState(false);
  const [imageLoading, setImageLoading] = useState(!isSvgDataUrl(uri));
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const height = typeof flatStyle.height === "number" ? flatStyle.height : 240;
  const width = typeof flatStyle.width === "number" ? flatStyle.width : undefined;

  if (failed) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>{LABELS.IMAGE_PREVIEW_EMPTY}</Text>
      </View>
    );
  }

  if (isSvgDataUrl(uri)) {
    const xml = decodeSvgXmlFromDataUrl(uri);
    if (!xml) {
      return (
        <View style={[styles.fallback, style]}>
          <Text style={styles.fallbackText}>{LABELS.IMAGE_PREVIEW_EMPTY}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.wrap, style]}>
        <SvgXml
          xml={xml}
          width={width ?? "100%"}
          height={height}
          onLoad={() => {
            setImageLoading(false);
            onLoad?.();
          }}
          onError={() => {
            setFailed(true);
            onError?.();
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      {imageLoading ? (
        <Skeleton width="100%" height={height} borderRadius={RADIUS.LG} style={StyleSheet.absoluteFill} />
      ) : null}
      <Image
        source={{ uri }}
        style={[style, imageLoading && styles.hidden]}
        resizeMode="cover"
        accessibilityLabel={accessibilityLabel}
        onLoad={() => {
          setImageLoading(false);
          onLoad?.();
        }}
        onError={() => {
          setImageLoading(false);
          setFailed(true);
          onError?.();
        }}
      />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    wrap: { overflow: "hidden", borderRadius: RADIUS.LG, backgroundColor: colors.muted },
    hidden: { opacity: 0 },
    fallback: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
      borderRadius: RADIUS.LG,
    },
    fallbackText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", padding: 16 },
  });
