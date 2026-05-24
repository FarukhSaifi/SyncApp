"use client";
import dayjs from "dayjs";
import React, { useEffect, useRef, useState } from "react";
import {
  FiChevronDown,
  FiClock,
  FiDownload,
  FiGlobe,
  FiImage,
  FiSend,
  FiUpload,
  FiZap,
} from "react-icons/fi";

import Button from "@components/common/Button";
import Input from "@components/common/Input";

import { APP_CONFIG } from "@constants";
import { PUBLISH_SECTIONS } from "@constants/editor";
import { SYNC_LABEL } from "@constants/messages";

interface EditorSidebarRightProps {
  isOpen: boolean;
  postId?: string;
  status: string;
  publishing: boolean;
  loading: boolean;
  onSaveDraft: () => void;
  onPublishToPlatform: (platform: string) => void;
  onPublishToAll: () => void;
  onDownloadMdx: () => void;
  // Scheduling
  scheduledFor: string;
  onScheduleChange: (value: string) => void;
  // AI
  aiKeyword: string;
  setAiKeyword: (v: string) => void;
  aiImagePrompt: string;
  setAiImagePrompt: (v: string) => void;
  aiLoading: string;
  generatedImageDataUrl: string | null;
  uploadingCover: boolean;
  onGeneratePost: () => void;
  onGenerateImage: () => void;
  onUseAsFeaturedImage: () => void;
  onUploadAndAttach: () => void;
}

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
      <button
        type="button"
        className="sidebar-section-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <FiChevronDown className="h-4 w-4" />
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <aside className={`editor-sidebar-right ${isOpen ? "open" : ""}`}>
      {/* Publish Panel */}
      <Section
        title={PUBLISH_SECTIONS.PUBLISH}
        icon={<FiSend className="h-3.5 w-3.5" />}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </span>
            <span className={`status-badge status-badge--${status}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>

          {/* Scheduling */}
          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <FiClock className="h-3 w-3" />
              Schedule Publication
            </label>
            <input
              type="datetime-local"
              value={scheduledFor ? dayjs(scheduledFor).format("YYYY-MM-DDTHH:mm") : ""}
              onChange={(e) => onScheduleChange(e.target.value)}
              className="w-full text-xs rounded-md border border-border bg-background px-2 py-1.5 hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
              disabled={status === "published" || publishing}
            />
            {scheduledFor && dayjs(scheduledFor).isAfter(dayjs()) && (
              <p className="text-[10px] text-primary/80 italic">
                Post will automatically publish on {dayjs(scheduledFor).format(APP_CONFIG.DATE_FORMAT_WITH_TIME)}
              </p>
            )}
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
      <Section
        title={PUBLISH_SECTIONS.EXPORT}
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
          {SYNC_LABEL.EXPORT_MDX}
        </Button>
      </Section>

      {/* AI Assistant */}
      <Section
        title={PUBLISH_SECTIONS.AI_ASSISTANT}
        icon={<FiZap className="h-3.5 w-3.5 text-primary" />}
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{SYNC_LABEL.AI_ASSISTANT_HINT}</p>

          {/* Keyword + Generate Actions */}
          <div className="space-y-2">
            <Input
              value={aiKeyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiKeyword(e.target.value)}
              placeholder={SYNC_LABEL.AI_KEYWORD_PLACEHOLDER}
              className="text-xs"
              size="sm"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onGeneratePost}
              disabled={!!aiLoading}
              className="w-full justify-center"
            >
              <FiZap className="h-3.5 w-3.5 mr-1.5" />
              {aiLoading === "post" ? "Generating Post..." : "Generate Full Post"}
            </Button>
            
            {/* Additional Image Instructions */}
            <div className="pt-2 border-t border-border mt-2">
              <label className="block text-xs font-medium text-foreground mb-1">
                Additional image instructions (optional)
              </label>
              <textarea
                value={aiImagePrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAiImagePrompt(e.target.value)}
                rows={2}
                className="w-full text-xs rounded-md border border-border bg-background px-2 py-1.5 resize-y mb-2"
                placeholder="e.g. minimalist, blue tones, abstract..."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onGenerateImage}
                disabled={!!aiLoading}
                className="w-full justify-center"
              >
              <FiImage className="h-3.5 w-3.5 mr-1.5" />
              {aiLoading === "image"
                ? SYNC_LABEL.AI_IMAGE_LOADING
                : SYNC_LABEL.AI_GENERATE_IMAGE}
            </Button>
            </div>
          </div>

          {/* Generated Image Preview */}
              {generatedImageDataUrl && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">
                    {SYNC_LABEL.FEATURED_IMAGE_PREVIEW}
                  </p>
                  <img
                    src={generatedImageDataUrl}
                    alt="Generated featured"
                    className="ai-image-preview"
                  />
                  <div className="flex flex-col gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onUseAsFeaturedImage}
                      className="w-full justify-center text-xs"
                    >
                      {SYNC_LABEL.USE_AS_FEATURED_IMAGE}
                    </Button>
                    {postId && (
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={onUploadAndAttach}
                        disabled={uploadingCover}
                        className="w-full justify-center text-xs"
                      >
                        <FiUpload className="h-3.5 w-3.5 mr-1.5" />
                        {uploadingCover ? "Uploading…" : SYNC_LABEL.UPLOAD_AND_ATTACH}
                      </Button>
                    )}
                  </div>
                </div>
              )}
        </div>
      </Section>
    </aside>
  );
};

export default EditorSidebarRight;
