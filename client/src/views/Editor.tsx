"use client";
/**
 * Editor — WordPress-inspired three-panel layout orchestrator.
 * Composes EditorToolbar, EditorContent, EditorSidebarLeft, EditorSidebarRight, EditorStatusBar.
 * All business logic lives in useEditorState and useEditorAI hooks.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import "../components/editor/editor.css";

import EditorSidebarLeft from "@components/editor/EditorSidebarLeft";
import EditorSidebarRight from "@components/editor/EditorSidebarRight";
import { EditorContentSkeleton } from "@components/editor/EditorSkeletons";
import EditorStatusBar from "@components/editor/EditorStatusBar";
import EditorToolbar from "@components/editor/EditorToolbar";
import SeoImproveReviewModal from "@components/editor/SeoImproveReviewModal";
import { useEditorAI } from "@hooks/useEditorAI";
import { useEditorState } from "@hooks/useEditorState";
import { useKeyboardShortcuts } from "@hooks/useKeyboardShortcuts";
import { useToast } from "@hooks/useToast";
import { useUnsavedLeaveGuard } from "@hooks/useUnsavedLeaveGuard";
import { useWordCount } from "@hooks/useWordCount";
import type { EditorProps } from "@types";
import { normalizeMarkdownNewlines, toStorageMarkdown } from "@utils/contentUtils";
import { applyLinkedInReadMoreUrl, extractLinkedInReadMoreUrl, resolveLinkedInReadMoreUrl } from "@utils/linkedinPost";
import { applySeoImproveFixes, buildSeoImproveTargets } from "@utils/seoImproveTargets";
import { getSeoScorecard } from "@utils/seoScorecard";
import dynamic from "next/dynamic";

import { AI_COVER_AUTOGEN_DELAY_MS, AI_LOADING } from "@constants/editor";
import { EDITOR_UI, SYNC_LABEL } from "@constants/messages";
import { PLATFORMS } from "@constants/platforms";
import { POST_STATUS } from "@constants/postStatus";
import { SEO_THRESHOLDS } from "@constants/seo";

import ConfirmationModal from "@components/common/ConfirmationModal";

const EditorContent = dynamic(() => import("@components/editor/EditorContent"), {
  ssr: false,
  loading: () => <EditorContentSkeleton />,
});

const Editor = ({ onPostCreate, onPostUpdate }: EditorProps) => {
  const aiKeywordRef = useRef("");
  const targetPlatformsRef = useRef<string[]>([]);

  const state = useEditorState({
    onPostCreate,
    onPostUpdate,
    getSeoContext: () => ({
      primaryKeyword: aiKeywordRef.current,
      platforms: targetPlatformsRef.current,
    }),
  });
  const preferredReadMoreUrl = resolveLinkedInReadMoreUrl(state.formData.canonical_url);
  const { setFormData } = state;
  const toast = useToast();
  const leaveGuard = useUnsavedLeaveGuard(state.isDirty);

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
      setTimeout(() => ai.handleGenerateImage(), AI_COVER_AUTOGEN_DELAY_MS);
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

  // Restore keyword/targets from the last persisted score so editor matches dashboard.
  useEffect(() => {
    if (state.initialLoading) {
      return;
    }
    const { primaryKeyword, platforms } = state.persistedSeoContext;
    if (primaryKeyword.trim() && !ai.aiKeyword.trim()) {
      ai.setAiKeyword(primaryKeyword);
    }
    if (platforms.length > 0 && ai.targetPlatforms.length === 0) {
      ai.setTargetPlatforms(platforms);
    }
    // Only when finishing load for a post
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.initialLoading, state.id, state.persistedSeoContext]);

  // Keep SEO persist context in sync with AI targets (read at save time via refs).
  useEffect(() => {
    aiKeywordRef.current = ai.aiKeyword;
    targetPlatformsRef.current = ai.targetPlatforms;
  }, [ai.aiKeyword, ai.targetPlatforms]);

  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(false);

  // Hydrate LinkedIn panel from persisted post fields once load completes.
  useEffect(() => {
    if (state.initialLoading) {
      return;
    }
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
    if (!preferredReadMoreUrl || !currentPost.trim()) {
      return;
    }
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

  const linkedinConnected = state.connectedPlatforms.includes(PLATFORMS["LINKEDIN"]);
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
        onBack={() => leaveGuard.requestLeave(() => state.router.push("/"))}
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

      {/* Both sidebars use MUI temporary Drawer on mobile; each owns its own Modal backdrop. */}
      <EditorSidebarLeft
        isOpen={leftSidebarOpen}
        onClose={() => setLeftSidebarOpen(false)}
        formData={state.formData}
        tagList={state.tagList}
        tagInput={state.tagInput}
        setTagInput={state.setTagInput}
        onInputChange={state.handleInputChange}
        onCoverImageChange={(url) => {
          setFormData((prev) => ({ ...prev, cover_image: url }));
        }}
        onAddTag={state.handleAddTag}
        onRemoveTag={state.handleRemoveTag}
        onTagKeyDown={state.handleTagKeyDown}
        contentLoading={state.initialLoading}
        seoPrimaryKeyword={ai.aiKeyword}
        seoPlatforms={ai.targetPlatforms}
        improveWithAiLoading={ai.aiLoading === AI_LOADING["IMPROVE"]}
        improveWithAiDisabled={!!ai.aiLoading && ai.aiLoading !== AI_LOADING["IMPROVE"]}
        onImproveWithAi={() => {
          const scorecard = getSeoScorecard(
            {
              title: state.formData.title,
              meta_description: state.formData.meta_description,
              tags: state.tagList,
              cover_image: state.formData.cover_image,
              canonical_url: state.formData.canonical_url,
              content_markdown: state.formData.content_markdown,
            },
            { primaryKeyword: ai.aiKeyword, platforms: ai.targetPlatforms },
          );
          const targets = buildSeoImproveTargets(
            {
              title: state.formData.title,
              meta_description: state.formData.meta_description,
              tags: state.tagList,
              canonical_url: state.formData.canonical_url,
              content_markdown: state.formData.content_markdown,
            },
            scorecard.checks,
          );
          if (targets.length === 0) {
            toast.validationError(SYNC_LABEL["AI_SEO_IMPROVE_NONE"]);
            return;
          }
          void ai.handleImproveWithAi(targets);
        }}
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
        onClose={() => setRightSidebarOpen(false)}
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
        scheduledPlatforms={state.formData.scheduled_platforms}
        onScheduleSave={state.handleScheduleSave}
        coverImage={state.formData.cover_image}
        aiKeyword={ai.aiKeyword}
        setAiKeyword={ai.setAiKeyword}
        aiModel={ai.aiModel}
        setAiModel={ai.setAiModel}
        aiModels={ai.aiModels}
        targetPlatforms={ai.targetPlatforms}
        setTargetPlatforms={ai.setTargetPlatforms}
        researchContext={ai.researchContext}
        applyResearchPick={ai.applyResearchPick}
        selectSuggestionKeyword={ai.selectSuggestionKeyword}
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
        onPublishLinkedInPost={() =>
          void state.handlePublishToPlatform(PLATFORMS["LINKEDIN"], linkedinPublishOverrides)
        }
        onGenerateLinkedInSummary={() => void ai.handleGenerateLinkedInSummary()}
        onGeneratePost={ai.handleGeneratePost}
        onGenerateImage={ai.handleGenerateImage}
        onUseAsFeaturedImage={ai.handleUseAsFeaturedImage}
        onUploadAndAttach={ai.handleUploadAndAttach}
        generatedImageUrl={ai.generatedImageUrl}
        onCopyImageUrl={ai.handleCopyImageUrl}
        onDownloadImage={ai.handleDownloadImage}
      />

      <EditorStatusBar
        wordCount={wordStats.words}
        characterCount={wordStats.characters}
        readingTimeMinutes={wordStats.readingTimeMinutes}
        lastSavedAt={state.lastSavedAt}
        isDirty={state.isDirty}
      />

      <ConfirmationModal
        isOpen={leaveGuard.isLeaveModalOpen}
        onClose={leaveGuard.closeLeaveModal}
        onConfirm={leaveGuard.confirmLeave}
        title={EDITOR_UI.UNSAVED_LEAVE_TITLE}
        message={EDITOR_UI.UNSAVED_LEAVE_MESSAGE}
        confirmText={EDITOR_UI.UNSAVED_LEAVE_CONFIRM}
        cancelText={EDITOR_UI.UNSAVED_LEAVE_CANCEL}
      />

      <SeoImproveReviewModal
        isOpen={ai.improveReviewOpen}
        onClose={ai.closeImproveReview}
        items={ai.improveReviewItems}
        onToggleItem={ai.toggleImproveReviewItem}
        onApply={() => {
          ai.handleApplyImproveFixes((fixes) => {
            const patched = applySeoImproveFixes(
              {
                title: state.formData.title,
                meta_description: state.formData.meta_description || "",
                tags: state.tagList,
                canonical_url: state.formData.canonical_url || "",
                content_markdown: state.formData.content_markdown || "",
              },
              fixes,
            );
            const markdown = toStorageMarkdown(normalizeMarkdownNewlines(patched.content_markdown));
            setFormData((prev) => ({
              ...prev,
              title: patched.title || prev.title,
              meta_description: patched.meta_description,
              canonical_url: patched.canonical_url,
              content_markdown: markdown,
            }));
            if (fixes.some((f) => f.field === "tags")) {
              state.setTagList(patched.tags.slice(0, SEO_THRESHOLDS.TAG_COUNT_MAX));
            }
          });
        }}
      />
    </div>
  );
};

export default Editor;
