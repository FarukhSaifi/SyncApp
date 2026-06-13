"use client";
import React, { useEffect, useRef, useState } from "react";

import PostStatusPill from "@components/dashboard/PostStatusPill";
import GeneratePostModal from "@components/editor/GeneratePostModal";
import SchedulePostModal from "@components/editor/SchedulePostModal";
import { APP_CONFIG } from "@constants";
import type { EditorSidebarRightProps } from "@types";
import dayjs from "dayjs";
import { FiChevronDown, FiClock, FiDownload, FiGlobe, FiImage, FiSend, FiUpload, FiZap } from "react-icons/fi";

import { PUBLISH_SECTIONS } from "@constants/editor";
import { EDITOR_UI, SYNC_LABEL } from "@constants/messages";

import Button from "@components/common/Button";
import Input from "@components/common/Input";
import LazyImage from "@components/common/LazyImage";
import Modal from "@components/common/Modal";

import { ImagePreviewSkeleton } from "./EditorSkeletons";

/** Collapsible section (same pattern as left sidebar) */
const Section = ({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sidebar-section">
      <button type="button" className="sidebar-section-header" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <FiChevronDown className="sidebar-section-chevron h-4 w-4" />
      </button>
      {open && <div className="sidebar-section-body">{children}</div>}
    </div>
  );
};

const EditorSidebarRight = ({
  isOpen,
  postId,
  status,
  publishing,
  loading,
  onSaveDraft,
  onPublishToPlatform,
  onPublishToAll,
  onDownloadMdx,
  scheduledFor,
  onScheduleChange,
  coverImage,
  // AI props
  aiKeyword,
  setAiKeyword,
  aiImagePrompt,
  setAiImagePrompt,
  aiLoading,
  generatedImageDataUrl,
  uploadingCover,
  onGeneratePost,
  onGenerateImage,
  onUseAsFeaturedImage,
  onUploadAndAttach,
}: EditorSidebarRightProps) => {
  const [publishDropdownOpen, setPublishDropdownOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [cachedBase64, setCachedBase64] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wasGeneratingPostRef = useRef(false);

  // Retrieve cached base64 image on cover image changes
  useEffect(() => {
    if (coverImage && typeof window !== "undefined") {
      const cached = sessionStorage.getItem(`cover_preview_${coverImage}`);
      setCachedBase64(cached);
    } else {
      setCachedBase64(null);
    }
  }, [coverImage]);

  // Auto-open image modal when generation starts or when image is available
  useEffect(() => {
    if (aiLoading === "image" || generatedImageDataUrl) {
      setIsImageModalOpen(true);
    }
  }, [aiLoading, generatedImageDataUrl]);

  // Close generate modal after post draft completes
  useEffect(() => {
    if (aiLoading === "post") {
      wasGeneratingPostRef.current = true;
      return;
    }
    if (wasGeneratingPostRef.current && !aiLoading && isGenerateModalOpen) {
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
  const scheduleDisabled = status === "published" || publishing;

  return (
    <aside className={`editor-sidebar-right ${isOpen ? "open" : ""}`}>
      {/* Publish Panel */}
      <Section title={PUBLISH_SECTIONS.PUBLISH} icon={<FiSend className="h-3.5 w-3.5" />}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {EDITOR_UI.STATUS_LABEL}
            </span>
            <PostStatusPill status={status} scheduledFor={scheduledFor} size="SM" />
          </div>

          {/* Scheduling */}
          <div className="space-y-2 pt-1 border-t border-border/40">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <FiClock className="h-3 w-3" />
              {EDITOR_UI.SCHEDULE_PUBLICATION_LABEL}
            </span>

            {isScheduled ? (
              <p className="text-xs text-muted-foreground">
                {EDITOR_UI.SCHEDULE_AUTO_PUBLISH(dayjs(scheduledFor).format(APP_CONFIG.DATE_FORMAT_WITH_TIME))}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{EDITOR_UI.SCHEDULE_MODAL_DESC}</p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsScheduleModalOpen(true)}
              disabled={scheduleDisabled}
              className="w-full justify-center"
            >
              <FiClock className="h-3.5 w-3.5 mr-1.5" />
              {isScheduled ? EDITOR_UI.SCHEDULE_MODAL_EDIT : EDITOR_UI.SCHEDULE_MODAL_BUTTON}
            </Button>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? SYNC_LABEL.SAVING : SYNC_LABEL.SAVE_DRAFT}
            </Button>

            {/* Publish dropdown */}
            <div className="publish-dropdown" ref={dropdownRef}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPublishDropdownOpen(!publishDropdownOpen)}
                disabled={publishing}
                className="w-full justify-center"
              >
                <FiSend className="h-3.5 w-3.5 mr-1.5" />
                {publishing ? SYNC_LABEL.PUBLISHING : PUBLISH_SECTIONS.PUBLISH}
                <FiChevronDown className="h-3.5 w-3.5 ml-1.5" />
              </Button>

              {publishDropdownOpen && (
                <div className="publish-dropdown-menu">
                  <button
                    className="publish-dropdown-item"
                    onClick={() => {
                      setPublishDropdownOpen(false);
                      onPublishToPlatform("medium");
                    }}
                    disabled={publishing}
                  >
                    <FiSend className="h-3.5 w-3.5" />
                    {SYNC_LABEL.PUBLISH_TO_MEDIUM}
                  </button>
                  <button
                    className="publish-dropdown-item"
                    onClick={() => {
                      setPublishDropdownOpen(false);
                      onPublishToPlatform("devto");
                    }}
                    disabled={publishing}
                  >
                    <FiGlobe className="h-3.5 w-3.5" />
                    {SYNC_LABEL.PUBLISH_TO_DEVTO}
                  </button>
                  <button
                    className="publish-dropdown-item"
                    onClick={() => {
                      setPublishDropdownOpen(false);
                      onPublishToPlatform("wordpress");
                    }}
                    disabled={publishing}
                  >
                    <FiGlobe className="h-3.5 w-3.5" />
                    {SYNC_LABEL.PUBLISH_TO_WORDPRESS}
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    className="publish-dropdown-item font-medium"
                    onClick={() => {
                      setPublishDropdownOpen(false);
                      onPublishToAll();
                    }}
                    disabled={publishing}
                  >
                    <FiGlobe className="h-3.5 w-3.5" />
                    {SYNC_LABEL.PUBLISH_TO_ALL}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Export */}
      <Section title={PUBLISH_SECTIONS.EXPORT} icon={<FiDownload className="h-3.5 w-3.5" />} defaultOpen={false}>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadMdx}
          disabled={publishing}
          className="w-full justify-center"
        >
          <FiDownload className="h-3.5 w-3.5 mr-1.5" />
          {SYNC_LABEL.EXPORT_MDX}
        </Button>
      </Section>

      {/* AI Assistant */}
      <Section title={PUBLISH_SECTIONS.AI_ASSISTANT} icon={<FiZap className="h-3.5 w-3.5 text-primary" />}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{SYNC_LABEL.AI_ASSISTANT_HINT}</p>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsGenerateModalOpen(true)}
            disabled={!!aiLoading}
            className="w-full justify-center"
          >
            <FiZap className="h-3.5 w-3.5 mr-1.5" />
            {aiLoading === "post" ? EDITOR_UI.GENERATING_POST : EDITOR_UI.GENERATE_FULL_POST}
          </Button>

          <div className="pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImageModalOpen(true)}
              className="w-full justify-center"
            >
              <FiImage className="h-3.5 w-3.5 mr-1.5 text-primary" />
              {EDITOR_UI.GENERATE_AI_COVER_IMAGE}
            </Button>
          </div>
        </div>
      </Section>

      <GeneratePostModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        keyword={aiKeyword}
        onKeywordChange={setAiKeyword}
        onGenerate={onGeneratePost}
        isGenerating={aiLoading === "post"}
      />

      <SchedulePostModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        scheduledFor={scheduledFor}
        onScheduleChange={onScheduleChange}
        isPublished={status === "published"}
      />

      {/* AI Image Generation Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title={EDITOR_UI.AI_IMAGE_MODAL_TITLE}
        description={EDITOR_UI.AI_IMAGE_MODAL_DESC}
        size="2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-2">
          {/* Settings Section (5 cols on md) */}
          <div className="md:col-span-5 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                {EDITOR_UI.AI_IMAGE_TOPIC_LABEL}
              </label>
              <Input
                value={aiKeyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiKeyword(e.target.value)}
                placeholder={EDITOR_UI.AI_IMAGE_TOPIC_PLACEHOLDER}
                className="text-xs"
                size="sm"
              />
              <p className="text-[10px] text-muted-foreground">{EDITOR_UI.AI_IMAGE_TOPIC_HINT}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                {EDITOR_UI.AI_IMAGE_STYLE_LABEL}
              </label>
              <textarea
                value={aiImagePrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAiImagePrompt(e.target.value)}
                rows={4}
                className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 resize-none focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder={EDITOR_UI.AI_IMAGE_STYLE_PLACEHOLDER}
              />
              <p className="text-[10px] text-muted-foreground">{EDITOR_UI.AI_IMAGE_STYLE_HINT}</p>
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
              {aiLoading === "image" ? EDITOR_UI.CREATING_MASTERPIECE : EDITOR_UI.GENERATE_AI_IMAGE}
            </Button>
          </div>

          {/* Preview & Actions Section (7 cols on md) */}
          <div className="md:col-span-7 flex flex-col justify-between border border-border/60 rounded-xl p-4 bg-muted/20 dark:bg-muted/10 min-h-[300px]">
            <div className="flex-1 flex flex-col justify-center items-center">
              {aiLoading === "image" ? (
                <div className="relative w-full aspect-video rounded-lg border border-dashed border-primary/40 overflow-hidden">
                  <ImagePreviewSkeleton className="absolute inset-0 rounded-lg" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <FiZap className="h-8 w-8 text-primary mb-2 animate-pulse" />
                    <h4 className="text-sm font-semibold text-foreground">{EDITOR_UI.GENERATING_IMAGE}</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                      {EDITOR_UI.GENERATING_IMAGE_HINT}
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
                      alt="Cover masterpiece"
                      className="w-full aspect-video object-cover"
                      containerClassName="w-full aspect-video"
                      skeletonClassName="absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <span className="text-xs font-semibold text-white px-2.5 py-1 rounded bg-black/50 backdrop-blur-sm">
                        {generatedImageDataUrl ? EDITOR_UI.AI_MASTERPIECE_BADGE : EDITOR_UI.ACTIVE_COVER_BADGE}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-center text-muted-foreground italic">
                    {generatedImageDataUrl ? EDITOR_UI.IMAGE_GENERATED_CAPTION : EDITOR_UI.IMAGE_CURRENT_CAPTION}
                  </p>
                </div>
              ) : (
                /* Cozy Empty State */
                <div className="text-center p-6 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    <FiImage className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{EDITOR_UI.NO_IMAGE_TITLE}</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
                      {EDITOR_UI.NO_IMAGE_HINT}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA action block */}
            {generatedImageDataUrl && !aiLoading && (
              <div className="mt-4 pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUseAsFeaturedImage();
                    setIsImageModalOpen(false);
                  }}
                  className="w-full justify-center text-xs py-2"
                >
                  {EDITOR_UI.APPLY_LOCALLY}
                </Button>
                {postId ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      await onUploadAndAttach();
                      setIsImageModalOpen(false);
                    }}
                    disabled={uploadingCover}
                    className="w-full justify-center text-xs py-2"
                  >
                    <FiUpload className="h-3.5 w-3.5 mr-1.5" />
                    {uploadingCover ? EDITOR_UI.UPLOADING : EDITOR_UI.UPLOAD_AND_SAVE}
                  </Button>
                ) : (
                  <div className="col-span-1 sm:col-span-2 text-center text-[10px] text-amber-500 bg-amber-500/10 px-2 py-1.5 rounded-md border border-amber-500/20">
                    {EDITOR_UI.SAVE_DRAFT_FIRST_HINT}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </aside>
  );
};

export default EditorSidebarRight;
