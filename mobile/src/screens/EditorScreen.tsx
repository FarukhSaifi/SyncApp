import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";

import { EditorWorkspace } from "@components/editor/EditorWorkspace";
import { EditorSkeleton } from "@components/skeletons/EditorSkeleton";
import { ROUTES, TOAST } from "@constants";
import { useThemeColors } from "@contexts/ThemeContext";
import { useEditorState } from "@hooks/useEditorState";
import { toast } from "@hooks/useToast";
import type { EditorScreenProps } from "@types";
import { consumePendingCoverUri } from "@utils/editorCoverPending";

export default function EditorScreen({ postId }: EditorScreenProps) {
  const colors = useThemeColors();
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
    unpublish,
    generatePost,
    generateLinkedInSummary,
    uploadCoverFromUri,
    aiEdit,
    readiness,
    platforms,
    connectedPlatforms,
    loadingPlatforms,
    reloadConnectedPlatforms,
    platformStatus,
    aiTargetPlatforms,
    toggleAiTargetPlatform,
  } = useEditorState(postId);

  useFocusEffect(
    useCallback(() => {
      void reloadConnectedPlatforms();
      const uri = consumePendingCoverUri();
      if (uri) {
        updateField("cover_image", uri);
        toast.success(TOAST.COVER_IMAGE_SET);
      }
    }, [reloadConnectedPlatforms, updateField]),
  );

  if (loading) {
    return (
      <View collapsable={false} style={{ flex: 1, backgroundColor: colors.groupedBackground }}>
        <EditorSkeleton />
      </View>
    );
  }

  const openGenerateImage = () => {
    router.push({
      pathname: ROUTES.EDITOR_GENERATE_IMAGE,
      params: { topic: form.title.trim() },
    });
  };

  return (
    <EditorWorkspace
      form={form}
      saving={saving}
      publishing={publishing}
      aiLoading={aiLoading}
      readiness={readiness}
      updateField={updateField}
      handleSave={handleSave}
      publish={publish}
      publishAll={publishAll}
      unpublish={unpublish}
      generatePost={generatePost}
      generateLinkedInSummary={generateLinkedInSummary}
      uploadCoverFromUri={uploadCoverFromUri}
      aiEdit={aiEdit}
      openGenerateImage={openGenerateImage}
      platforms={platforms}
      connectedPlatforms={connectedPlatforms}
      loadingPlatforms={loadingPlatforms}
      platformStatus={platformStatus}
      aiTargetPlatforms={aiTargetPlatforms}
      toggleAiTargetPlatform={toggleAiTargetPlatform}
    />
  );
}
