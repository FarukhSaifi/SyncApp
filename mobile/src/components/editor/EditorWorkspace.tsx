import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import { Button } from "@/src/components/Button";
import { ChannelsTab } from "@/src/components/editor/ChannelsTab";
import { DetailsTab } from "@/src/components/editor/DetailsTab";
import { EditorHeader } from "@/src/components/editor/EditorHeader";
import { EditorModeTabs } from "@/src/components/editor/EditorModeTabs";
import { ReviewPublishSheet } from "@/src/components/editor/ReviewPublishSheet";
import { WriteTab } from "@/src/components/editor/WriteTab";
import { ROUTES } from "@/src/constants";
import { BUTTON_VARIANTS, IOS26 } from "@/src/constants/designTokens";
import { ERRORS } from "@/src/constants/messages";
import type { PlatformSlug } from "@/src/constants/platforms";
import { POST_STATUS } from "@/src/constants/postStatus";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { toast } from "@/src/hooks/useToast";
import { apiClient } from "@/src/services/apiClient";
import type { EditorForm, EditorMode, EditorReadiness, Post } from "@/src/types";

export interface EditorWorkspaceProps {
  form: EditorForm;
  saving: boolean;
  publishing: boolean;
  aiLoading: boolean;
  readiness: EditorReadiness;
  updateField: <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => void;
  handleSave: (forceStatus?: string) => Promise<Post | null>;
  publish: (platform: string, savedPostId?: string) => Promise<void>;
  publishAll: (savedPostId?: string) => Promise<void>;
  generatePost: (keyword: string) => Promise<void>;
  generateLinkedInSummary: () => Promise<void>;
  aiEdit: (action: string) => Promise<void>;
  openGenerateImage: () => void;
  platforms: typeof import("@/src/constants/platforms").PLATFORMS;
  connectedPlatforms: PlatformSlug[];
  loadingPlatforms?: boolean;
}

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
  generatePost,
  generateLinkedInSummary,
  openGenerateImage,
  platforms,
  connectedPlatforms,
  loadingPlatforms = false,
}: EditorWorkspaceProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
            aiEdit={handleAiEditWithPreview}
            generatePost={generatePost}
            aiLoading={aiLoading}
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
          />
        ) : null}

        {mode === "details" ? <DetailsTab form={form} updateField={updateField} /> : null}
      </ScrollView>

      {/* 4. Bottom Sticky Action Command Bar */}
      <View style={styles.bottomBar}>
        <Button
          title={form.status === POST_STATUS.DRAFT ? "Save Draft" : "Save Changes"}
          variant={BUTTON_VARIANTS.OUTLINE}
          onPress={() => void handleSave(POST_STATUS.DRAFT)}
          loading={saving}
          style={styles.saveBtn}
        />
        {connectedPlatforms.length === 0 ? (
          <Button
            title={loadingPlatforms ? "Checking Channels..." : "Connect Channels"}
            variant={BUTTON_VARIANTS.SECONDARY}
            onPress={() => router.push(ROUTES.SETTINGS as any)}
            style={styles.publishBtn}
          />
        ) : (
          <Button
            title="Review & Publish"
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

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    shell: {
      flex: 1,
      backgroundColor: colors.groupedBackground,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: IOS26.SCREEN_PADDING,
      paddingBottom: 24,
    },
    bottomBar: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 28,
      backgroundColor: colors.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 12,
    },
    saveBtn: {
      flex: 1,
    },
    publishBtn: {
      flex: 1.5,
    },
  });
