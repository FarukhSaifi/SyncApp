import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/Button";
import { ImagePreviewFrame } from "@/src/components/ImagePreviewFrame";
import { Input } from "@/src/components/Input";
import { DESCRIPTIONS, EDITOR_CONFIG, ERRORS, LABELS, PLACEHOLDERS, TOAST } from "@/src/constants";
import { BUTTON_VARIANTS, IOS26, RADIUS } from "@/src/constants/designTokens";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { toast } from "@/src/hooks/useToast";
import { apiClient } from "@/src/services/apiClient";
import { setPendingCoverUri } from "@/src/utils/editorCoverPending";
import { isPlaceholderImageDataUrl } from "@/src/utils/imageDataUrl";

interface GenerateImageScreenProps {
  defaultTopic?: string;
}

export default function GenerateImageScreen({ defaultTopic = "" }: GenerateImageScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [topic, setTopic] = useState(defaultTopic);
  const [stylePrompt, setStylePrompt] = useState<string>(EDITOR_CONFIG.AI_IMAGE_STYLE_PROMPT);
  const [loading, setLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  useEffect(() => {
    setTopic(defaultTopic);
    setPreviewUri(null);
  }, [defaultTopic]);

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      toast.error(ERRORS.IMAGE_TOPIC_REQUIRED);
      return;
    }
    setLoading(true);
    setPreviewUri(null);
    try {
      const res = await apiClient.aiGenerateImage(trimmed, stylePrompt.trim() || undefined);
      const uri = res.data?.imageDataUrl;
      if (res.success && uri) {
        setPreviewUri(uri);
        if (isPlaceholderImageDataUrl(uri)) {
          toast.info(TOAST.IMAGE_PLACEHOLDER);
        } else {
          toast.success(TOAST.IMAGE_GENERATED);
        }
      } else {
        toast.error(res.error ?? ERRORS.AI_IMAGE_FAILED);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCover = () => {
    if (!previewUri) return;
    setPendingCoverUri(previewUri);
    router.back();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.hint}>{DESCRIPTIONS.GENERATE_IMAGE}</Text>

      <View style={styles.group}>
        <Input
          label={LABELS.IMAGE_TOPIC}
          value={topic}
          onChangeText={setTopic}
          placeholder={LABELS.KEYWORD}
          autoCapitalize="sentences"
        />
        <Input
          label={LABELS.IMAGE_STYLE_PROMPT}
          value={stylePrompt}
          onChangeText={setStylePrompt}
          placeholder={PLACEHOLDERS.IMAGE_STYLE}
          multiline
          style={{ minHeight: 72, textAlignVertical: "top" }}
        />
      </View>

      <Button title={LABELS.GENERATE_IMAGE} onPress={handleGenerate} loading={loading} />

      <View style={styles.previewSection}>
        <Text style={styles.previewLabel}>{LABELS.IMAGE_PREVIEW}</Text>
        <ImagePreviewFrame generating={loading} uri={previewUri} minHeight={240} />
      </View>

      {previewUri && !loading ? (
        <View style={styles.actions}>
          <Button title={LABELS.USE_AS_COVER} onPress={handleUseCover} style={styles.flex} />
          <Button
            title={LABELS.REGENERATE}
            variant={BUTTON_VARIANTS.OUTLINE}
            onPress={handleGenerate}
            loading={loading}
            style={styles.flex}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.groupedBackground },
    content: { padding: IOS26.SCREEN_PADDING, paddingBottom: 32 },
    hint: { fontSize: 15, color: colors.mutedForeground, marginBottom: 16, lineHeight: 22 },
    group: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.LG,
      padding: 16,
      marginBottom: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    previewSection: { marginTop: 8 },
    previewLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.mutedForeground,
      marginBottom: 8,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    actions: { flexDirection: "row", gap: 8, marginTop: 16 },
    flex: { flex: 1 },
  });
