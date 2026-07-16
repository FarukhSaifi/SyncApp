"use client";
/**
 * Editor — WordPress-inspired three-panel layout orchestrator.
 * Composes EditorToolbar, EditorContent, EditorSidebarLeft, EditorSidebarRight, EditorStatusBar.
 * All business logic lives in useEditorState and useEditorAI hooks.
 */

import { useCallback, useState } from "react";

import "../components/editor/editor.css";

import EditorSidebarLeft from "@components/editor/EditorSidebarLeft";
import EditorSidebarRight from "@components/editor/EditorSidebarRight";
import { EditorContentSkeleton } from "@components/editor/EditorSkeletons";
import EditorStatusBar from "@components/editor/EditorStatusBar";
import EditorToolbar from "@components/editor/EditorToolbar";
import { useEditorAI } from "@hooks/useEditorAI";
import { useEditorState } from "@hooks/useEditorState";
import { useKeyboardShortcuts } from "@hooks/useKeyboardShortcuts";
import { useWordCount } from "@hooks/useWordCount";
import type { EditorProps } from "@types";
import dynamic from "next/dynamic";

import { CANONICAL_BASE_URL } from "@constants/api";
import { POST_STATUS } from "@constants/postStatus";
import { SEO_THRESHOLDS } from "@constants/seo";

const EditorContent = dynamic(() => import("@components/editor/EditorContent"), {
  ssr: false,
  loading: () => <EditorContentSkeleton />,
});

function buildCanonicalFromAi(slugOrUrl: string): string {
  const value = slugOrUrl.trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return CANONICAL_BASE_URL ? `${CANONICAL_BASE_URL}/${value.replace(/^\/+/, "")}` : value;
}

const Editor = ({ onPostCreate, onPostUpdate }: EditorProps) => {
  const state = useEditorState({ onPostCreate, onPostUpdate });
  const ai = useEditorAI({
    postId: state.id,
    getPostDraft: () => ({
      title: state.formData.title,
      meta_description: state.formData.meta_description,
      content_markdown: state.formData.content_markdown,
      tags: state.tagList,
    }),
    onDraftGenerated: (data, source = "generate") => {
      state.setFormData((prev) => ({
        ...prev,
        content_markdown: data.content || "",
        title: data.title || prev.title,
        meta_description: data.meta_description || prev.meta_description,
        canonical_url: data.canonical_url
          ? buildCanonicalFromAi(data.canonical_url) || prev.canonical_url
          : prev.canonical_url,
      }));
      if (data.tags && data.tags.length > 0) {
        state.setTagList(data.tags.slice(0, SEO_THRESHOLDS.TAG_COUNT_MAX));
      }
      if (source === "generate") {
        setTimeout(() => ai.handleGenerateImage(), 500);
      }
    },
    onCoverImageSet: (url) => {
      state.setFormData((prev) => ({ ...prev, cover_image: url }));
    },
  });
  const wordStats = useWordCount(state.formData.content_markdown);

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const closeSidebars = useCallback(() => {
    setLeftSidebarOpen(false);
    setRightSidebarOpen(false);
  }, []);

  useKeyboardShortcuts({
    onSave: () => state.handleSave(),
    onTogglePreview: state.togglePreview,
    onEscape: closeSidebars,
  });

  const handleContentChange = useCallback(
    (html: string) => {
      state.setFormData((prev) => {
        if (prev.content_markdown !== html) {
          return { ...prev, content_markdown: html };
        }
        return prev;
      });
    },
    [state],
  );

  return (
    <div className="editor-layout">
      <EditorToolbar
        isEditing={!!state.id}
        activeTab={state.activeTab}
        onTogglePreview={state.togglePreview}
        onSave={() => state.handleSave()}
        onBack={() => state.router.push("/")}
        loading={state.loading}
        isDirty={state.isDirty}
        wordCount={wordStats.words}
        onToggleLeftSidebar={() => {
          setLeftSidebarOpen((p) => !p);
          setRightSidebarOpen(false);
        }}
        onToggleRightSidebar={() => {
          setRightSidebarOpen((p) => !p);
          setLeftSidebarOpen(false);
        }}
      />

      {(leftSidebarOpen || rightSidebarOpen) && <div className="editor-drawer-backdrop" onClick={closeSidebars} />}

      <EditorSidebarLeft
        isOpen={leftSidebarOpen}
        formData={state.formData}
        tagList={state.tagList}
        tagInput={state.tagInput}
        setTagInput={state.setTagInput}
        onInputChange={state.handleInputChange}
        onAddTag={state.handleAddTag}
        onRemoveTag={state.handleRemoveTag}
        onTagKeyDown={state.handleTagKeyDown}
        contentLoading={state.initialLoading}
      />

      {state.initialLoading ? (
        <EditorContentSkeleton />
      ) : (
        <EditorContent
          formData={state.formData}
          activeTab={state.activeTab}
          onTitleChange={state.handleInputChange}
          onContentChange={handleContentChange}
          tagList={state.tagList}
        />
      )}

      <EditorSidebarRight
        isOpen={rightSidebarOpen}
        postId={state.id}
        status={state.formData.status}
        publishing={state.publishing}
        loading={state.loading}
        onSaveDraft={() => state.handleSave(POST_STATUS.DRAFT)}
        onPublishToPlatform={state.handlePublishToPlatform}
        onPublishToAll={state.handlePublishToAll}
        connectedPlatforms={state.connectedPlatforms}
        onDownloadMdx={state.handleDownloadMdx}
        scheduledFor={state.formData.scheduled_for}
        onScheduleSave={state.handleScheduleSave}
        coverImage={state.formData.cover_image}
        aiKeyword={ai.aiKeyword}
        setAiKeyword={ai.setAiKeyword}
        aiModel={ai.aiModel}
        setAiModel={ai.setAiModel}
        aiModels={ai.aiModels}
        targetPlatforms={ai.targetPlatforms}
        setTargetPlatforms={ai.setTargetPlatforms}
        aiImagePrompt={ai.aiImagePrompt}
        setAiImagePrompt={ai.setAiImagePrompt}
        aiLoading={ai.aiLoading}
        generatedImageDataUrl={ai.generatedImageDataUrl}
        uploadingCover={ai.uploadingCover}
        onGeneratePost={ai.handleGeneratePost}
        onOptimiseForPublish={ai.handleOptimiseForPublish}
        onGenerateImage={ai.handleGenerateImage}
        onUseAsFeaturedImage={ai.handleUseAsFeaturedImage}
        onUploadAndAttach={ai.handleUploadAndAttach}
      />

      <EditorStatusBar
        wordCount={wordStats.words}
        characterCount={wordStats.characters}
        readingTimeMinutes={wordStats.readingTimeMinutes}
        lastSavedAt={state.lastSavedAt}
        isDirty={state.isDirty}
      />
    </div>
  );
};

export default Editor;
