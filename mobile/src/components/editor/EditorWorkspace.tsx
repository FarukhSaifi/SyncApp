import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import { Button } from "@components/Button";
import { ChannelsTab } from "@components/editor/ChannelsTab";
import { DetailsTab } from "@components/editor/DetailsTab";
import { EditorHeader } from "@components/editor/EditorHeader";
import { EditorModeTabs } from "@components/editor/EditorModeTabs";
import { ReviewPublishSheet } from "@components/editor/ReviewPublishSheet";
import { WriteTab } from "@components/editor/WriteTab";
import { ROUTES } from "@constants";
import { BUTTON_VARIANTS } from "@constants/designTokens";
import { ERRORS, LABELS } from "@constants/messages";
import type { OptimizationTarget, PlatformSlug } from "@constants/platforms";
import { POST_STATUS } from "@constants/postStatus";
import { useThemeColors } from "@contexts/ThemeContext";
import { useResponsiveLayout } from "@hooks/useResponsiveLayout";
import { toast } from "@hooks/useToast";
import { apiClient } from "@services/apiClient";
import type { EditorMode, EditorWorkspaceProps } from "@types";

export function EditorWorkspace({
  form,
  saving,
  publishing,
  aiLoading,
  readiness,
  updateField,
  handleSave,
  publish,
  publishAll,
  unpublish,
  generatePost,
  generateLinkedInSummary,
  uploadCoverFromUri,
  openGenerateImage,
  platforms,
  connectedPlatforms,
  loadingPlatforms = false,
  platformStatus,
  aiTargetPlatforms,
  toggleAiTargetPlatform,
}: EditorWorkspaceProps) {
  const colors = useThemeColors();
  const layout = useResponsiveLayout();
  const styles = useMemo(
    () => createStyles(colors, layout.isCompact, layout.horizontalPadding),
    [colors, layout.isCompact, layout.horizontalPadding],
  );
  const router = useRouter();

  const [mode, setMode] = useState<EditorMode>("write");
  const [reviewVisible, setReviewVisible] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformSlug[]>(connectedPlatforms);

  useEffect(() => {
    setSelectedPlatforms((curr) => {
      const valid = curr.filter((p) => connectedPlatforms.includes(p));
      if (valid.length === 0 && connectedPlatforms.length > 0) {
        return connectedPlatforms;
      }
      return valid;
    });
  }, [connectedPlatforms]);

  const togglePlatform = (platform: PlatformSlug) => {
    if (!connectedPlatforms.includes(platform)) return;
    setSelectedPlatforms((curr) =>
      curr.includes(platform) ? curr.filter((p) => p !== platform) : [...curr, platform],
    );
  };

  // Reversible AI edit implementation
  const handleAiEditWithPreview = async (action: string): Promise<string | void> => {
    if (!form.content_markdown.trim()) return;
    try {
      const res = await apiClient.aiEdit(action, form.content_markdown);
      if (res.success && res.data?.result) {
        return res.data.result;
      } else {
        toast.error(res.error ?? ERRORS.AI_EDIT_FAILED);
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const publishSelected = async () => {
    setReviewVisible(false);
    const post = await handleSave();
    const valid = selectedPlatforms.filter((p) => connectedPlatforms.includes(p));
    if (!post || !valid.length) return;
    const postId = post._id || post.id;
    if (!postId) return;
    if (valid.length === connectedPlatforms.length) {
      await publishAll(postId);
      return;
    }
    for (const platform of valid) {
      await publish(platform, postId);
    }
  };

  const wordCount = form.content_markdown.trim().split(/\s+/).filter(Boolean).length;

  return (
    <KeyboardAvoidingView style={styles.shell} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* 1. Header with Stats & Save Status */}
      <EditorHeader
        title={form.title}
        wordCount={wordCount}
        saving={saving}
        readiness={readiness}
        onOpenReview={() => setReviewVisible(true)}
      />

      {/* 2. Top Segmented Navigation Tabs */}
      <EditorModeTabs mode={mode} onChangeMode={setMode} channelCount={selectedPlatforms.length} />

      {/* 3. Tab Content Area */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        {mode === "write" ? (
          <WriteTab
            form={form}
            updateField={updateField}
            openGenerateImage={openGenerateImage}
            uploadCoverFromUri={uploadCoverFromUri}
            aiEdit={handleAiEditWithPreview}
            generatePost={generatePost}
            aiLoading={aiLoading}
            aiTargetPlatforms={aiTargetPlatforms}
            toggleAiTargetPlatform={toggleAiTargetPlatform}
          />
        ) : null}

        {mode === "channels" ? (
          <ChannelsTab
            form={form}
            platforms={platforms}
            connectedPlatforms={connectedPlatforms}
            loadingPlatforms={loadingPlatforms}
            selectedPlatforms={selectedPlatforms}
            togglePlatform={togglePlatform}
            updateField={updateField}
            generateLinkedInSummary={generateLinkedInSummary}
            aiLoading={aiLoading}
            platformStatus={platformStatus}
            unpublish={unpublish}
            publishing={publishing}
          />
        ) : null}

        {mode === "details" ? (
          <DetailsTab form={form} connectedPlatforms={connectedPlatforms} updateField={updateField} />
        ) : null}
      </ScrollView>

      {/* 4. Bottom Sticky Action Command Bar */}
      <View style={styles.bottomBar}>
        <Button
          title={form.status === POST_STATUS.DRAFT ? LABELS.SAVE_DRAFT : LABELS.SAVE_CHANGES}
          variant={BUTTON_VARIANTS.OUTLINE}
          onPress={() => void handleSave(POST_STATUS.DRAFT)}
          loading={saving}
          style={styles.saveBtn}
        />
        {connectedPlatforms.length === 0 ? (
          <Button
            title={loadingPlatforms ? LABELS.CHECKING_CHANNELS : LABELS.CONNECT_CHANNELS}
            variant={BUTTON_VARIANTS.SECONDARY}
            onPress={() => router.push(ROUTES.SETTINGS)}
            style={styles.publishBtn}
          />
        ) : (
          <Button
            title={LABELS.REVIEW_AND_PUBLISH}
            onPress={() => setReviewVisible(true)}
            disabled={!readiness.ready || !selectedPlatforms.length}
            style={styles.publishBtn}
          />
        )}
      </View>

      {/* 5. Pre-flight Review & Publish Bottom Sheet */}
      <ReviewPublishSheet
        visible={reviewVisible}
        form={form}
        readiness={readiness}
        connectedPlatforms={connectedPlatforms}
        selectedPlatforms={selectedPlatforms}
        togglePlatform={togglePlatform}
        onClose={() => setReviewVisible(false)}
        onPublish={() => void publishSelected()}
        publishing={publishing}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>, isCompact: boolean, horizontalPadding: number) =>
  StyleSheet.create({
    shell: {
      flex: 1,
      backgroundColor: colors.groupedBackground,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: horizontalPadding,
      paddingBottom: 24,
    },
    bottomBar: {
      flexDirection: isCompact ? "column" : "row",
      paddingHorizontal: horizontalPadding,
      paddingTop: 12,
      paddingBottom: 28,
      backgroundColor: colors.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 12,
    },
    saveBtn: {
      flex: isCompact ? undefined : 1,
    },
    publishBtn: {
      flex: isCompact ? undefined : 1.5,
    },
  });
