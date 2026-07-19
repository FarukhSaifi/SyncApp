"use client";
/**
 * Editor — WordPress-inspired three-panel layout orchestrator.
 * Composes EditorToolbar, EditorContent, EditorSidebarLeft, EditorSidebarRight, EditorStatusBar.
 * All business logic lives in useEditorState and useEditorAI hooks.
 */

import { useCallback, useEffect, useState } from "react";

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
import { normalizeMarkdownNewlines, toStorageMarkdown } from "@utils/contentUtils";
import { applyLinkedInReadMoreUrl, extractLinkedInReadMoreUrl, resolveLinkedInReadMoreUrl } from "@utils/linkedinPost";
import dynamic from "next/dynamic";

import { PLATFORMS } from "@constants/platforms";
import { POST_STATUS } from "@constants/postStatus";
import { SEO_THRESHOLDS } from "@constants/seo";

const EditorContent = dynamic(() => import("@components/editor/EditorContent"), {
  ssr: false,
  loading: () => <EditorContentSkeleton />,
});

const Editor = ({ onPostCreate, onPostUpdate }: EditorProps) => {
  const state = useEditorState({ onPostCreate, onPostUpdate });
  const preferredReadMoreUrl = resolveLinkedInReadMoreUrl(state.formData.canonical_url);
  const { setFormData } = state;

  const ai = useEditorAI({
    postId: state.id,
    preferredReadMoreUrl,
    getArticleContext: () => ({
      title: state.formData.title || "",
      content: state.formData.content_markdown || "",
    }),
    onDraftGenerated: (data) => {
      const linkedinPost = data.linkedin_post?.trim() || "";
      const readMore = data.read_more_url?.trim() || preferredReadMoreUrl || "";
      // Keep markdown as source of truth — TipTap converts via toEditorHtml for display only.
      const markdown = toStorageMarkdown(normalizeMarkdownNewlines(data.content || ""));
      setFormData((prev) => ({
        ...prev,
        content_markdown: markdown,
        title: data.title || prev.title,
        meta_description: data.meta_description || prev.meta_description,
        linkedin_post: linkedinPost,
        linkedin_read_more_url: readMore,
      }));
      if (data.tags && data.tags.length > 0) {
        state.setTagList(data.tags.slice(0, SEO_THRESHOLDS.TAG_COUNT_MAX));
      }
      setTimeout(() => ai.handleGenerateImage(), 500);
    },
    onLinkedInSummaryGenerated: (data) => {
      setFormData((prev) => ({
        ...prev,
        linkedin_post: data.linkedin_post,
        linkedin_read_more_url: data.read_more_url?.trim() || preferredReadMoreUrl || "",
      }));
    },
    onCoverImageSet: (url) => {
      setFormData((prev) => ({ ...prev, cover_image: url }));
    },
  });
  const wordStats = useWordCount(state.formData.content_markdown);

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Hydrate LinkedIn panel from persisted post fields once load completes.
  useEffect(() => {
    if (state.initialLoading) return;
    const saved = String(state.formData.linkedin_post || "").trim();
    if (saved) {
      ai.hydrateLinkedInPost(saved, false);
    }
    // Only when finishing initial load / switching posts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.initialLoading, state.id]);

  // Keep form LinkedIn teaser in sync when canonical URL becomes available.
  useEffect(() => {
    const currentPost = String(state.formData.linkedin_post || "");
    const currentReadMore = String(state.formData.linkedin_read_more_url || "");
    if (!preferredReadMoreUrl || !currentPost.trim()) return;
    const next = applyLinkedInReadMoreUrl(currentPost, preferredReadMoreUrl);
    if (next !== currentPost || currentReadMore !== preferredReadMoreUrl) {
      setFormData((prev) => ({
        ...prev,
        linkedin_post: next,
        linkedin_read_more_url: preferredReadMoreUrl,
      }));
    }
  }, [preferredReadMoreUrl, state.formData.linkedin_post, state.formData.linkedin_read_more_url, setFormData]);

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
      const markdown = toStorageMarkdown(html);
      state.setFormData((prev) => {
        if (prev.content_markdown !== markdown) {
          return { ...prev, content_markdown: markdown };
        }
        return prev;
      });
    },
    [state],
  );

  const linkedinConnected = state.connectedPlatforms.includes(PLATFORMS.LINKEDIN);
  const formLinkedInPost = String(state.formData.linkedin_post || "").trim() || null;
  const formLinkedInReadMore = String(state.formData.linkedin_read_more_url || "").trim() || null;
  const displayLinkedInPost = ai.linkedinPost || formLinkedInPost;
  const displayLinkedInReadMore =
    ai.linkedinReadMoreUrl || extractLinkedInReadMoreUrl(displayLinkedInPost || "") || formLinkedInReadMore;

  const linkedinPublishOverrides = {
    linkedin_post: displayLinkedInPost || "",
    linkedin_read_more_url: displayLinkedInReadMore || "",
  };

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
        onPublishToPlatform={(platform) => void state.handlePublishToPlatform(platform, linkedinPublishOverrides)}
        onPublishToAll={() => void state.handlePublishToAll(linkedinPublishOverrides)}
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
        generatedImageSource={ai.generatedImageSource}
        uploadingCover={ai.uploadingCover}
        linkedinPost={displayLinkedInPost}
        linkedinReadMoreUrl={displayLinkedInReadMore}
        linkedinMissingCanonical={ai.linkedinMissingCanonical}
        linkedinConnected={linkedinConnected}
        onCopyLinkedInPost={() => {
          if (!ai.linkedinPost?.trim() && displayLinkedInPost) {
            ai.hydrateLinkedInPost(displayLinkedInPost, false);
          }
          void ai.handleCopyLinkedInPost();
        }}
        onPublishLinkedInPost={() => void state.handlePublishToPlatform(PLATFORMS.LINKEDIN, linkedinPublishOverrides)}
        onGenerateLinkedInSummary={() => void ai.handleGenerateLinkedInSummary()}
        onGeneratePost={ai.handleGeneratePost}
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
