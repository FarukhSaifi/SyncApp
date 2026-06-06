import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Card, CardContent, CardHeader } from "@/src/components/Card";
import { CoverImagePreview } from "@/src/components/CoverImagePreview";
import { Input } from "@/src/components/Input";
import { EditorSkeleton } from "@/src/components/skeletons/EditorSkeleton";
import { EDITOR_CONFIG, LABELS, ROUTES, TOAST } from "@/src/constants";
import { BUTTON_VARIANTS, IOS26 } from "@/src/constants/designTokens";
import { POST_STATUS } from "@/src/constants/postStatus";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { useEditorState } from "@/src/hooks/useEditorState";
import { toast } from "@/src/hooks/useToast";
import { consumePendingCoverUri } from "@/src/utils/editorCoverPending";

interface EditorScreenProps {
  postId?: string;
}

export default function EditorScreen({ postId }: EditorScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const {
    form,
    loading,
    saving,
    publishing,
    aiLoading,
    updateField,
    handleSave,
    publish,
    publishAll,
    generatePost,
    aiEdit,
    platforms,
  } = useEditorState(postId);

  const [aiKeyword, setAiKeyword] = useState("");

  useFocusEffect(
    useCallback(() => {
      const uri = consumePendingCoverUri();
      if (uri) {
        updateField("cover_image", uri);
        toast.success(TOAST.COVER_IMAGE_SET);
      }
    }, [updateField]),
  );

  if (loading) {
    return (
      <View collapsable={false} style={styles.shell}>
        <EditorSkeleton />
      </View>
    );
  }

  const defaultImageTopic = form.title.trim() || aiKeyword.trim();

  const openGenerateImage = () => {
    router.push({
      pathname: ROUTES.EDITOR_GENERATE_IMAGE,
      params: { topic: defaultImageTopic },
    });
  };

  return (
    <View collapsable={false} style={styles.shell}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Card style={styles.sectionCard}>
          <CardHeader title={LABELS.TITLE} />
          <CardContent>
            <Input label={LABELS.TITLE} value={form.title} onChangeText={(v) => updateField("title", v)} />
            <Input
              label={LABELS.CONTENT}
              value={form.content_markdown}
              onChangeText={(v) => updateField("content_markdown", v)}
              multiline
              style={{ minHeight: 200, textAlignVertical: "top" }}
            />
          </CardContent>
        </Card>

        <Card style={styles.sectionCard}>
          <CardHeader title={LABELS.TAGS} />
          <CardContent>
            <Input
              label={LABELS.TAGS}
              value={form.tags.join(", ")}
              onChangeText={(v) =>
                updateField(
                  "tags",
                  v
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
            />
            <Input
              label={LABELS.META}
              value={form.meta_description}
              onChangeText={(v) => updateField("meta_description", v)}
            />
            <Input
              label={LABELS.CANONICAL}
              value={form.canonical_url}
              onChangeText={(v) => updateField("canonical_url", v)}
              autoCapitalize="none"
            />
            <Input
              label={LABELS.SCHEDULE}
              value={form.scheduled_for}
              onChangeText={(v) => updateField("scheduled_for", v)}
              placeholder={EDITOR_CONFIG.SCHEDULE_PLACEHOLDER}
            />
          </CardContent>
        </Card>

        <Card style={styles.sectionCard}>
          <CardHeader title={LABELS.COVER_PREVIEW} />
          <CardContent>
            <CoverImagePreview
              uri={form.cover_image}
              onPress={openGenerateImage}
              onRemove={() => updateField("cover_image", "")}
            />
            <Input
              label={LABELS.COVER_IMAGE}
              value={form.cover_image}
              onChangeText={(v) => updateField("cover_image", v)}
              autoCapitalize="none"
            />
          </CardContent>
        </Card>

        <View style={styles.row}>
          <Button title={LABELS.SAVE} onPress={() => handleSave()} loading={saving} style={styles.flex} />
          <Button
            title={LABELS.SAVE_DRAFT}
            variant={BUTTON_VARIANTS.OUTLINE}
            onPress={() => handleSave(POST_STATUS.DRAFT)}
            loading={saving}
            style={styles.flex}
          />
        </View>

        <Text style={styles.section}>{LABELS.PUBLISH}</Text>
        <Card style={styles.sectionCard}>
          <CardContent>
            <View style={styles.row}>
              <Button
                title={LABELS.MEDIUM}
                variant={BUTTON_VARIANTS.OUTLINE}
                onPress={() => publish(platforms.MEDIUM)}
                loading={publishing}
                style={styles.flex}
              />
              <Button
                title={LABELS.DEVTO}
                variant={BUTTON_VARIANTS.OUTLINE}
                onPress={() => publish(platforms.DEVTO)}
                loading={publishing}
                style={styles.flex}
              />
            </View>
            <View style={styles.row}>
              <Button
                title={LABELS.WORDPRESS}
                variant={BUTTON_VARIANTS.OUTLINE}
                onPress={() => publish(platforms.WORDPRESS)}
                loading={publishing}
                style={styles.flex}
              />
              <Button title={LABELS.PUBLISH_ALL} onPress={publishAll} loading={publishing} style={styles.flex} />
            </View>
          </CardContent>
        </Card>

        <Text style={styles.section}>{LABELS.AI_SECTION}</Text>
        <Card style={styles.sectionCard}>
          <CardContent>
            <View style={styles.aiGroup}>
              <Input value={aiKeyword} onChangeText={setAiKeyword} placeholder={LABELS.KEYWORD} />
              <Button title={LABELS.GENERATE_POST} onPress={() => generatePost(aiKeyword)} loading={aiLoading} />
              <Button
                title={LABELS.GENERATE_IMAGE}
                variant={BUTTON_VARIANTS.OUTLINE}
                onPress={openGenerateImage}
                style={{ marginTop: 8 }}
              />
              <Button
                title={LABELS.AI_EDIT}
                variant={BUTTON_VARIANTS.OUTLINE}
                onPress={() => aiEdit(EDITOR_CONFIG.AI_EDIT_DEFAULT_ACTION)}
                loading={aiLoading}
                style={{ marginTop: 8 }}
              />
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    shell: { flex: 1, backgroundColor: colors.groupedBackground },
    container: { flex: 1 },
    content: { padding: IOS26.SCREEN_PADDING, paddingBottom: 40 },
    sectionCard: { marginBottom: IOS26.GROUPED_GAP },
    row: { flexDirection: "row", gap: 8, marginTop: 4 },
    flex: { flex: 1 },
    section: {
      fontSize: 13,
      fontWeight: "600",
      marginTop: 24,
      marginBottom: 8,
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    aiGroup: { gap: 0 },
  });
