"use client";

import React, { useEffect, useRef, useState } from "react";

import PostStatusPill from "@components/dashboard/PostStatusPill";
import GeneratePostModal from "@components/editor/GeneratePostModal";
import LinkedInPostPanel from "@components/editor/LinkedInPostPanel";
import SchedulePostModal from "@components/editor/SchedulePostModal";
import { APP_CONFIG, PLATFORMS } from "@constants";
import { useMediaQuery } from "@hooks/useMediaQuery";
import type { EditorSidebarRightProps } from "@types";
import { readCoverPreviewCache } from "@utils/coverPreviewCache";
import dayjs from "dayjs";
import {
  FiChevronDown,
  FiClock,
  FiCopy,
  FiDownload,
  FiGlobe,
  FiImage,
  FiLinkedin,
  FiSend,
  FiUpload,
  FiX,
  FiZap,
} from "react-icons/fi";

import { AI_LOADING, EDITOR_LAYOUT, PUBLISH_SECTIONS } from "@constants/editor";
import { EDITOR_UI, SYNC_LABEL } from "@constants/messages";
import { POST_STATUS } from "@constants/postStatus";

import Button from "@components/common/Button";
import Input from "@components/common/Input";
import LazyImage from "@components/common/LazyImage";
import Modal from "@components/common/Modal";

import EditorSidebarSection from "./EditorSidebarSection";
import { ImagePreviewSkeleton } from "./EditorSkeletons";

const EditorSidebarRight = ({
  isOpen,
  onClose,
  postId,
  status,
  publishing,
  loading,
  onSaveDraft,
  onPublishToPlatform,
  onPublishToAll,
  connectedPlatforms,
  onDownloadMdx,
  scheduledFor,
  onScheduleSave,
  coverImage,
  // AI props
  aiKeyword,
  setAiKeyword,
  aiModel,
  setAiModel,
  aiModels,
  targetPlatforms,
  setTargetPlatforms,
  researchContext,
  applyResearchPick,
  clearResearchContext,
  aiImagePrompt,
  setAiImagePrompt,
  aiLoading,
  generatedImageDataUrl,
  generatedImageUrl = null,
  generatedImageSource = null,
  uploadingCover,
  linkedinPost = null,
  linkedinReadMoreUrl = null,
  linkedinMissingCanonical = false,
  linkedinConnected = false,
  onCopyLinkedInPost,
  onPublishLinkedInPost,
  onGenerateLinkedInSummary,
  onGeneratePost,
  onGenerateImage,
  onUseAsFeaturedImage,
  onUploadAndAttach,
  onCopyImageUrl,
  onDownloadImage,
}: EditorSidebarRightProps) => {
  const [publishDropdownOpen, setPublishDropdownOpen] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [cachedBase64, setCachedBase64] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wasGeneratingPostRef = useRef(false);
  const isDesktop = useMediaQuery(EDITOR_LAYOUT["DESKTOP_MEDIA_QUERY"]);

  // Retrieve cached base64 image on cover image changes
  useEffect(() => {
    if (coverImage) {
      setCachedBase64(readCoverPreviewCache(coverImage));
    } else {
      setCachedBase64(null);
    }
  }, [coverImage]);

  // Auto-open image modal when generation starts or when image is available
  useEffect(() => {
    if (aiLoading === AI_LOADING["IMAGE"] || generatedImageDataUrl) {
      setIsImageModalOpen(true);
    }
  }, [aiLoading, generatedImageDataUrl]);

  // Close generate modal after post draft completes; reset tracking when modal is closed
  useEffect(() => {
    if (!isGenerateModalOpen) {
      wasGeneratingPostRef.current = false;
      return;
    }

    if (aiLoading === AI_LOADING["POST"]) {
      wasGeneratingPostRef.current = true;
      return;
    }

    if (wasGeneratingPostRef.current && !aiLoading) {
      setIsGenerateModalOpen(false);
      wasGeneratingPostRef.current = false;
    }
  }, [aiLoading, isGenerateModalOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPublishDropdownOpen(false);
      }
    };
    if (publishDropdownOpen) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [publishDropdownOpen]);

  const isScheduled = Boolean(scheduledFor && dayjs(scheduledFor).isAfter(dayjs()));
  const scheduleDisabled = status === POST_STATUS["PUBLISHED"] || publishing;
  const hasConnectedPlatforms = connectedPlatforms.length > 0;
  const publishDisabled = publishing || !hasConnectedPlatforms;

  const publishPlatformOptions = [
    { platform: PLATFORMS["MEDIUM"], label: SYNC_LABEL["PUBLISH_TO_MEDIUM"], icon: FiSend },
    { platform: PLATFORMS["DEVTO"], label: SYNC_LABEL["PUBLISH_TO_DEVTO"], icon: FiGlobe },
    { platform: PLATFORMS["WORDPRESS"], label: SYNC_LABEL["PUBLISH_TO_WORDPRESS"], icon: FiGlobe },
    { platform: PLATFORMS["LINKEDIN"], label: SYNC_LABEL["PUBLISH_TO_LINKEDIN"], icon: FiLinkedin },
  ].filter((option) => connectedPlatforms.includes(option.platform));

  const panelContent = (
    <>
      {/* Publish Panel */}
      <EditorSidebarSection title={PUBLISH_SECTIONS["PUBLISH"]} icon={<FiSend className="h-3.5 w-3.5" />}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {EDITOR_UI["STATUS_LABEL"]}
            </span>
            <PostStatusPill status={status} scheduledFor={scheduledFor} size="SM" />
          </div>

          {/* Scheduling */}
          <div className="space-y-2 pt-1 border-t border-border/40">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <FiClock className="h-3 w-3" />
              {EDITOR_UI["SCHEDULE_PUBLICATION_LABEL"]}
            </span>

            {isScheduled ? (
              <p className="text-xs text-muted-foreground">
                {EDITOR_UI["SCHEDULE_AUTO_PUBLISH"](dayjs(scheduledFor).format(APP_CONFIG["DATE_FORMAT_WITH_TIME"]))}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{EDITOR_UI["SCHEDULE_MODAL_DESC"]}</p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                setIsScheduleModalOpen(true);
              }}
              disabled={scheduleDisabled}
              className="w-full justify-center"
            >
              <FiClock className="h-3.5 w-3.5 mr-1.5" />
              {isScheduled ? EDITOR_UI["SCHEDULE_MODAL_EDIT"] : EDITOR_UI["SCHEDULE_MODAL_BUTTON"]}
            </Button>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {!hasConnectedPlatforms && (
              <p className="text-xs text-muted-foreground">{SYNC_LABEL["CONNECT_PLATFORM_TO_PUBLISH"]}</p>
            )}

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={onSaveDraft}
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? SYNC_LABEL["SAVING"] : SYNC_LABEL["SAVE_DRAFT"]}
            </Button>

            {/* Publish dropdown */}
            <div className="publish-dropdown" ref={dropdownRef}>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setPublishDropdownOpen(!publishDropdownOpen)}
                disabled={publishDisabled}
                className="w-full justify-center"
                aria-expanded={publishDropdownOpen}
                aria-haspopup="menu"
              >
                <FiSend className="h-3.5 w-3.5 mr-1.5" />
                {publishing ? SYNC_LABEL["PUBLISHING"] : PUBLISH_SECTIONS["PUBLISH"]}
                <FiChevronDown className="h-3.5 w-3.5 ml-1.5" />
              </Button>

              {publishDropdownOpen && hasConnectedPlatforms && (
                <div className="publish-dropdown-menu" role="menu">
                  {publishPlatformOptions.map(({ platform, label, icon: Icon }) => (
                    <button
                      key={platform}
                      type="button"
                      role="menuitem"
                      className="publish-dropdown-item"
                      onClick={() => {
                        setPublishDropdownOpen(false);
                        onPublishToPlatform(platform);
                      }}
                      disabled={publishing}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                  {publishPlatformOptions.length > 0 && <div className="my-1 border-t border-border" />}
                  <button
                    type="button"
                    role="menuitem"
                    className="publish-dropdown-item font-medium"
                    onClick={() => {
                      setPublishDropdownOpen(false);
                      onPublishToAll();
                    }}
                    disabled={publishing}
                  >
                    <FiGlobe className="h-3.5 w-3.5" />
                    {SYNC_LABEL["PUBLISH_TO_ALL"]}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </EditorSidebarSection>

      {/* Export */}
      <EditorSidebarSection
        title={PUBLISH_SECTIONS["EXPORT"]}
        icon={<FiDownload className="h-3.5 w-3.5" />}
        defaultOpen={false}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadMdx}
          disabled={publishing}
          className="w-full justify-center"
        >
          <FiDownload className="h-3.5 w-3.5 mr-1.5" />
          {SYNC_LABEL["EXPORT_MDX"]}
        </Button>
      </EditorSidebarSection>

      {/* AI Assistant */}
      <EditorSidebarSection
        title={PUBLISH_SECTIONS["AI_ASSISTANT"]}
        icon={<FiZap className="h-3.5 w-3.5 text-primary" />}
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{SYNC_LABEL["AI_ASSISTANT_HINT"]}</p>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              setIsGenerateModalOpen(true);
            }}
            disabled={!!aiLoading}
            className="w-full justify-center"
          >
            <FiZap className="h-3.5 w-3.5 mr-1.5" />
            {aiLoading === AI_LOADING["POST"] ? EDITOR_UI["GENERATING_POST"] : EDITOR_UI["GENERATE_FULL_POST"]}
          </Button>

          <div className="pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                setIsImageModalOpen(true);
              }}
              className="w-full justify-center"
            >
              <FiImage className="h-3.5 w-3.5 mr-1.5 text-primary" />
              {EDITOR_UI["GENERATE_AI_COVER_IMAGE"]}
            </Button>
          </div>

          <div className="pt-2 border-t border-border">
            <LinkedInPostPanel
              linkedinPost={linkedinPost}
              linkedinReadMoreUrl={linkedinReadMoreUrl}
              linkedinMissingCanonical={linkedinMissingCanonical}
              linkedinConnected={linkedinConnected}
              publishing={publishing}
              generating={aiLoading === AI_LOADING["LINKEDIN"]}
              onCopy={onCopyLinkedInPost}
              onPublish={onPublishLinkedInPost}
              onGenerate={onGenerateLinkedInSummary}
              disabled={!!aiLoading && aiLoading !== AI_LOADING["LINKEDIN"]}
            />
          </div>
        </div>
      </EditorSidebarSection>
    </>
  );

  return (
    <>
      {isDesktop ? (
        <aside className="editor-sidebar-right">{panelContent}</aside>
      ) : isOpen ? (
        <div className="editor-drawer-root" role="presentation">
          <button
            type="button"
            className="editor-drawer-backdrop"
            aria-label={EDITOR_UI["CLOSE_PUBLISH_AI_DRAWER"]}
            onClick={onClose}
          />
          <aside
            className="editor-sidebar-right-drawer-paper editor-drawer-panel editor-drawer-panel-right"
            style={{ maxWidth: EDITOR_LAYOUT["RIGHT_DRAWER_WIDTH_PX"] }}
            role="dialog"
            aria-modal="true"
            aria-label={EDITOR_UI["PUBLISH_AI_DRAWER_TITLE"]}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">{EDITOR_UI["PUBLISH_AI_DRAWER_TITLE"]}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={EDITOR_UI["CLOSE_PUBLISH_AI_DRAWER"]}
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{panelContent}</div>
            </div>
          </aside>
        </div>
      ) : null}

      <GeneratePostModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        keyword={aiKeyword}
        onKeywordChange={setAiKeyword}
        selectedModel={aiModel}
        onModelChange={setAiModel}
        models={aiModels}
        targetPlatforms={targetPlatforms}
        onTargetPlatformsChange={setTargetPlatforms}
        onGenerate={onGeneratePost}
        isGenerating={aiLoading === AI_LOADING["POST"]}
        researchContext={researchContext}
        onResearchPick={applyResearchPick}
        onResearchClear={clearResearchContext}
      />

      <SchedulePostModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        scheduledFor={scheduledFor}
        onScheduleSave={onScheduleSave}
        isPublished={status === "published"}
        isSaving={loading}
      />

      {/* AI Image Generation Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title={EDITOR_UI["AI_IMAGE_MODAL_TITLE"]}
        description={EDITOR_UI["AI_IMAGE_MODAL_DESC"]}
        size="2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-2">
          {/* Settings Section (5 cols on md) */}
          <div className="md:col-span-5 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                {EDITOR_UI["AI_IMAGE_TOPIC_LABEL"]}
              </label>
              <Input
                value={aiKeyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiKeyword(e.target.value)}
                placeholder={EDITOR_UI["AI_IMAGE_TOPIC_PLACEHOLDER"]}
                className="text-xs"
                size="sm"
              />
              <p className="text-[10px] text-muted-foreground">{EDITOR_UI["AI_IMAGE_TOPIC_HINT"]}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                {EDITOR_UI["AI_IMAGE_STYLE_LABEL"]}
              </label>
              <textarea
                value={aiImagePrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAiImagePrompt(e.target.value)}
                rows={4}
                className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 resize-none focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder={EDITOR_UI["AI_IMAGE_STYLE_PLACEHOLDER"]}
              />
              <p className="text-[10px] text-muted-foreground">{EDITOR_UI["AI_IMAGE_STYLE_HINT"]}</p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onGenerateImage}
              disabled={!!aiLoading}
              className="w-full justify-center font-medium mt-2"
            >
              <FiZap className="h-3.5 w-3.5 mr-1.5 text-yellow-300" />
              {aiLoading === AI_LOADING["IMAGE"] ? EDITOR_UI["CREATING_MASTERPIECE"] : EDITOR_UI["GENERATE_AI_IMAGE"]}
            </Button>
          </div>

          {/* Preview & Actions Section (7 cols on md) */}
          <div className="md:col-span-7 flex flex-col justify-between border border-border/60 rounded-xl p-4 bg-muted/20 dark:bg-muted/10 min-h-[300px]">
            <div className="flex-1 flex flex-col justify-center items-center">
              {aiLoading === AI_LOADING["IMAGE"] ? (
                <div className="relative w-full aspect-video rounded-lg border border-dashed border-primary/40 overflow-hidden">
                  <ImagePreviewSkeleton className="absolute inset-0 rounded-lg" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <FiZap className="h-8 w-8 text-primary mb-2 animate-pulse" />
                    <h4 className="text-sm font-semibold text-foreground">{EDITOR_UI["GENERATING_IMAGE"]}</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                      {EDITOR_UI["GENERATING_IMAGE_HINT"]}
                    </p>
                  </div>
                </div>
              ) : uploadingCover ? (
                <ImagePreviewSkeleton className="w-full aspect-video rounded-lg border border-dashed border-primary/40" />
              ) : generatedImageDataUrl || cachedBase64 || coverImage ? (
                /* High-fidelity generated image presentation */
                <div className="space-y-3 w-full">
                  <div className="relative group rounded-lg overflow-hidden border border-border bg-background shadow-md transition-all duration-300 hover:shadow-lg">
                    <LazyImage
                      src={generatedImageDataUrl || cachedBase64 || coverImage || ""}
                      alt={EDITOR_UI["AI_COVER_IMAGE_ALT"]}
                      viewportLazy={false}
                      className="w-full aspect-video object-cover"
                      containerClassName="w-full aspect-video"
                      skeletonClassName="absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <span className="text-xs font-semibold text-white px-2.5 py-1 rounded bg-black/50 backdrop-blur-sm">
                        {generatedImageDataUrl
                          ? generatedImageSource
                            ? EDITOR_UI["AI_IMAGE_SOURCE_BADGE"](generatedImageSource)
                            : EDITOR_UI["AI_MASTERPIECE_BADGE"]
                          : EDITOR_UI["ACTIVE_COVER_BADGE"]}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-center text-muted-foreground italic">
                    {generatedImageDataUrl ? EDITOR_UI["IMAGE_GENERATED_CAPTION"] : EDITOR_UI["IMAGE_CURRENT_CAPTION"]}
                  </p>
                </div>
              ) : (
                /* Cozy Empty State */
                <div className="text-center p-6 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    <FiImage className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{EDITOR_UI["NO_IMAGE_TITLE"]}</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
                      {EDITOR_UI["NO_IMAGE_HINT"]}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Minimal, elegant action block */}
            {generatedImageDataUrl && !aiLoading && (
              <div className="mt-4 pt-3 border-t border-border/40 flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onUseAsFeaturedImage();
                      setIsImageModalOpen(false);
                    }}
                    className="w-full sm:flex-1 justify-center text-xs py-2 shadow-sm"
                  >
                    <FiImage className="h-3.5 w-3.5 mr-1.5" />
                    {EDITOR_UI["USE_AS_COVER"]}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onUploadAndAttach();
                    }}
                    disabled={!postId || uploadingCover}
                    className="w-full sm:flex-1 justify-center text-xs py-2"
                  >
                    <FiUpload className="h-3.5 w-3.5 mr-1.5" />
                    {uploadingCover ? EDITOR_UI["UPLOADING"] : EDITOR_UI["UPLOAD_AND_SAVE"]}
                  </Button>
                </div>
                {!postId && (
                  <p className="text-[10px] text-center text-muted-foreground">{EDITOR_UI["SAVE_DRAFT_FIRST_HINT"]}</p>
                )}
                <div className="flex items-center gap-2 w-full">
                  {onCopyImageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onCopyImageUrl}
                      className="flex-1 justify-center text-xs py-2"
                      title={generatedImageUrl ? EDITOR_UI["COPY_IMAGE_URL_TITLE"] : EDITOR_UI["COPY_IMAGE_DATA_TITLE"]}
                    >
                      <FiCopy className="h-3.5 w-3.5 mr-1.5" />
                      {EDITOR_UI["COPY_IMAGE_LINK"]}
                    </Button>
                  )}
                  {onDownloadImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onDownloadImage}
                      className="flex-1 justify-center text-xs py-2"
                    >
                      <FiDownload className="h-3.5 w-3.5 mr-1.5" />
                      {EDITOR_UI["DOWNLOAD_IMAGE"]}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EditorSidebarRight;
