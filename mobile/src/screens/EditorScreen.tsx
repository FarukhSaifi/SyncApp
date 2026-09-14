import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";

import { EditorWorkspace } from "@/src/components/editor/EditorWorkspace";
import { EditorSkeleton } from "@/src/components/skeletons/EditorSkeleton";
import { ROUTES, TOAST } from "@/src/constants";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { useEditorState } from "@/src/hooks/useEditorState";
import { toast } from "@/src/hooks/useToast";
import type { EditorScreenProps } from "@/src/types";
import { consumePendingCoverUri } from "@/src/utils/editorCoverPending";

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
    generatePost,
    generateLinkedInSummary,
    aiEdit,
    readiness,
    platforms,
    connectedPlatforms,
    loadingPlatforms,
    reloadConnectedPlatforms,
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
      generatePost={generatePost}
      generateLinkedInSummary={generateLinkedInSummary}
      aiEdit={aiEdit}
      openGenerateImage={openGenerateImage}
      platforms={platforms}
      connectedPlatforms={connectedPlatforms}
      loadingPlatforms={loadingPlatforms}
    />
  );
}
