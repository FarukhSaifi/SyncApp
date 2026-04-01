"use client";
/**
 * Editor — WordPress-inspired three-panel layout orchestrator.
 * Composes EditorToolbar, EditorContent, EditorSidebarLeft, EditorSidebarRight, EditorStatusBar.
 * All business logic lives in useEditorState and useEditorAI hooks.
 */
import "../components/editor/editor.css";
import React, { useCallback, useState } from "react";

import EditorContent from "@components/editor/EditorContent";
import EditorSidebarLeft from "@components/editor/EditorSidebarLeft";
import EditorSidebarRight from "@components/editor/EditorSidebarRight";
import EditorStatusBar from "@components/editor/EditorStatusBar";
import EditorToolbar from "@components/editor/EditorToolbar";

import { useEditorAI } from "@hooks/useEditorAI";
import { useEditorState } from "@hooks/useEditorState";
import { useKeyboardShortcuts } from "@hooks/useKeyboardShortcuts";
import { useWordCount } from "@hooks/useWordCount";

import type { Post } from "@types";

interface EditorProps {
  onPostCreate: (post: Post) => void;
  onPostUpdate: (post: Post) => void;
}

const Editor = ({ onPostCreate, onPostUpdate }: EditorProps) => {
  // State hooks
  const state = useEditorState({ onPostCreate, onPostUpdate });
  const ai = useEditorAI({
    postId: state.id,
    onDraftGenerated: (draft) => {
      state.setFormData((prev) => ({ ...prev, content_markdown: draft }));
    },
    onCoverImageSet: (url) => {
      state.setFormData((prev) => ({ ...prev, cover_image: url }));
    },
  });
  const wordStats = useWordCount(state.formData.content_markdown);

  // Sidebar open state (mobile drawers)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const closeSidebars = useCallback(() => {
    setLeftSidebarOpen(false);
    setRightSidebarOpen(false);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => state.handleSave("draft"),
    onTogglePreview: state.togglePreview,
    onEscape: closeSidebars,
  });

  // Content change handler (called by EditorContent Quill)
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
      {/* Toolbar */}
      <EditorToolbar
        isEditing={!!state.id}
        activeTab={state.activeTab}
        onTogglePreview={state.togglePreview}
        onSave={() => state.handleSave("draft")}
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

      {/* Mobile drawer backdrop */}
      {(leftSidebarOpen || rightSidebarOpen) && (
        <div className="editor-drawer-backdrop" onClick={closeSidebars} />
      )}

      {/* Left Sidebar — Post Settings */}
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
      />

      {/* Main Content */}
      <EditorContent
        formData={state.formData}
        activeTab={state.activeTab}
        onTitleChange={state.handleInputChange}
        onContentChange={handleContentChange}
        tagList={state.tagList}
      />

      {/* Right Sidebar — Publish + AI */}
      <EditorSidebarRight
        isOpen={rightSidebarOpen}
        postId={state.id}
        status={state.formData.status}
        publishing={state.publishing}
        loading={state.loading}
        onSaveDraft={() => state.handleSave("draft")}
        onPublishToPlatform={state.handlePublishToPlatform}
        onPublishToAll={state.handlePublishToAll}
        onDownloadMdx={state.handleDownloadMdx}
        // AI
        aiKeyword={ai.aiKeyword}
        setAiKeyword={ai.setAiKeyword}
        aiOutline={ai.aiOutline}
        setAiOutline={ai.setAiOutline}
        aiLoading={ai.aiLoading}
        generatedImageDataUrl={ai.generatedImageDataUrl}
        uploadingCover={ai.uploadingCover}
        onGenerateOutline={ai.handleGenerateOutline}
        onGenerateDraft={ai.handleGenerateDraft}
        onGenerateImage={ai.handleGenerateImage}
        onUseAsFeaturedImage={ai.handleUseAsFeaturedImage}
        onUploadAndAttach={ai.handleUploadAndAttach}
      />

      {/* Status Bar */}
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
