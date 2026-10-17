"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useMediaQuery } from "@hooks/useMediaQuery";
import { useToast } from "@hooks/useToast";
import type { EditorSidebarLeftProps, SeoScoreRingProps } from "@types";
import { apiClient } from "@utils/apiClient";
import { readCoverPreviewCache } from "@utils/coverPreviewCache";
import { getSeoScorecard } from "@utils/seoScorecard";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiImage,
  FiLink,
  FiTag,
  FiUpload,
  FiX,
} from "react-icons/fi";

import { BUTTON_SIZES, BUTTON_VARIANTS } from "@constants/designTokens";
import { COVER_UPLOAD, EDITOR_KEYS, EDITOR_LAYOUT, SIDEBAR_SECTIONS } from "@constants/editor";
import { EDITOR_UI, ERROR_MESSAGES, SUCCESS_MESSAGES, SYNC_LABEL, TOAST_TITLES } from "@constants/messages";
import { SEO_RING, SEO_THRESHOLDS } from "@constants/seo";

import Button from "@components/common/Button";
import Input from "@components/common/Input";
import LazyImage from "@components/common/LazyImage";
import Skeleton from "@components/common/Skeleton";

import EditorSidebarSection from "./EditorSidebarSection";

/** SEO Score ring indicator */
const SeoRing = ({ score, maxScore }: SeoScoreRingProps) => {
  const pct = maxScore > 0 ? score / maxScore : 0;
  const r = SEO_RING["RADIUS"];
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  const color =
    pct >= SEO_THRESHOLDS["RING_GOOD_RATIO"]
      ? SEO_RING["COLOR_GOOD"]
      : pct >= SEO_THRESHOLDS["RING_MID_RATIO"]
        ? SEO_RING["COLOR_MID"]
        : SEO_RING["COLOR_WEAK"];

  return (
    <div className="seo-score-ring">
      <svg width={SEO_RING["SIZE"]} height={SEO_RING["SIZE"]} viewBox={`0 0 ${SEO_RING["SIZE"]} ${SEO_RING["SIZE"]}`}>
        <circle
          cx={SEO_RING["CENTER"]}
          cy={SEO_RING["CENTER"]}
          r={r}
          fill="none"
          stroke={SEO_RING["TRACK_STROKE"]}
          strokeWidth={SEO_RING["STROKE_WIDTH"]}
        />
        <circle
          cx={SEO_RING["CENTER"]}
          cy={SEO_RING["CENTER"]}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={SEO_RING["STROKE_WIDTH"]}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="score-label" style={{ color }}>
        {score}
      </span>
    </div>
  );
};

const EditorSidebarLeft = ({
  isOpen,
  onClose,
  formData,
  tagList,
  tagInput,
  setTagInput,
  onInputChange,
  onCoverImageChange,
  onAddTag,
  onRemoveTag,
  onTagKeyDown,
  contentLoading = false,
}: EditorSidebarLeftProps) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<boolean>(false);
  const [lastCover, setLastCover] = useState<string>(formData.cover_image);
  const [cachedBase64, setCachedBase64] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const isDesktop = useMediaQuery(EDITOR_LAYOUT["DESKTOP_MEDIA_QUERY"]);

  useEffect(() => {
    if (formData.cover_image) {
      setCachedBase64(readCoverPreviewCache(formData.cover_image));
    } else {
      setCachedBase64(null);
    }
  }, [formData.cover_image]);

  if (formData.cover_image !== lastCover) {
    setImageError(false);
    setLastCover(formData.cover_image);
  }

  const openFilePicker = useCallback(() => {
    if (uploadingCover) {
      return;
    }
    fileInputRef.current?.click();
  }, [uploadingCover]);

  const uploadCoverFile = useCallback(
    async (file: File) => {
      const allowedCoverMimes = COVER_UPLOAD["ACCEPT"].split(",");
      if (!allowedCoverMimes.includes(file.type)) {
        toast.apiError(EDITOR_UI["COVER_UPLOAD_INVALID_TYPE"]);
        return;
      }
      if (file.size > COVER_UPLOAD["MAX_BYTES"]) {
        toast.apiError(EDITOR_UI["COVER_UPLOAD_TOO_LARGE"]);
        return;
      }

      setUploadingCover(true);
      const loadingId = toast.apiLoading(EDITOR_UI["COVER_UPLOADING"], TOAST_TITLES["LOADING"]);
      try {
        // Direct GCS path: signed V4 PUT → syncapp-ai-covers (or GCS_BUCKET_NAME), then public URL.
        const res = await apiClient.uploadImage(file);
        if (!res.success || !res.data?.url) {
          throw new Error(res.error || ERROR_MESSAGES["FAILED_TO_UPLOAD_COVER"]);
        }
        onCoverImageChange(res.data.url);
        setImageError(false);
        toast.apiSuccess(SUCCESS_MESSAGES["IMAGE_UPLOADED"], EDITOR_UI["COVER_UPLOAD_SUCCESS"]);
      } catch (err) {
        toast.apiError((err as Error).message || ERROR_MESSAGES["FAILED_TO_UPLOAD_COVER"]);
      } finally {
        if (loadingId) {
          toast.removeToast?.(loadingId);
        }
        setUploadingCover(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onCoverImageChange, toast],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void uploadCoverFile(file);
      }
    },
    [uploadCoverFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        void uploadCoverFile(file);
      }
    },
    [uploadCoverFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const seo = useMemo(
    () =>
      getSeoScorecard({
        title: formData.title,
        tags: tagList,
        cover_image: formData.cover_image,
        canonical_url: formData.canonical_url,
        meta_description: formData.meta_description,
        content_markdown: formData.content_markdown,
      }),
    [
      formData.title,
      tagList,
      formData.cover_image,
      formData.canonical_url,
      formData.meta_description,
      formData.content_markdown,
    ],
  );

  const tagsAtLimit = tagList.length >= SEO_THRESHOLDS["TAG_COUNT_MAX"];

  const panelContent = (
    <>
      {/* Tags */}
      <EditorSidebarSection title={SIDEBAR_SECTIONS["TAGS"]} icon={<FiTag className="h-3.5 w-3.5" />}>
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">{SYNC_LABEL["TAGS_HELP"]}</p>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
              onKeyDown={onTagKeyDown}
              placeholder={SYNC_LABEL["ADD_TAG"]}
              className="flex-1 text-xs"
              size="sm"
              disabled={tagsAtLimit}
            />
            <Button type="button" variant="default" size="sm" onClick={onAddTag} disabled={tagsAtLimit}>
              {SYNC_LABEL["ADD"]}
            </Button>
          </div>
          {tagsAtLimit && (
            <p className="text-[10px] text-yellow-600 dark:text-yellow-500">{SYNC_LABEL["TAGS_LIMIT_REACHED"]}</p>
          )}
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => onRemoveTag(tag)}
                    className="rounded p-0.5 hover:bg-primary/20 focus:outline-none"
                    aria-label={EDITOR_UI["REMOVE_TAG_ARIA"](tag)}
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </EditorSidebarSection>

      {/* Meta Description */}
      <EditorSidebarSection
        title={SYNC_LABEL["META_DESCRIPTION_LABEL"]}
        icon={<FiCheckCircle className="h-3.5 w-3.5" />}
      >
        <div className="space-y-2">
          <textarea
            name="meta_description"
            value={formData.meta_description || ""}
            onChange={onInputChange}
            placeholder={SYNC_LABEL["META_DESCRIPTION_PLACEHOLDER"]}
            rows={3}
            className="w-full resize-y rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>
              {SYNC_LABEL["CHARACTERS"]}
              {formData.meta_description?.length || 0}
            </span>
            <span
              className={
                formData.meta_description?.length >= SEO_THRESHOLDS["META_DESC_MIN"] &&
                formData.meta_description?.length <= SEO_THRESHOLDS["META_DESC_MAX"]
                  ? "text-green-500"
                  : "text-yellow-500"
              }
            >
              {SYNC_LABEL["AIM_SEO"]}
            </span>
          </div>
        </div>
      </EditorSidebarSection>

      {/* Featured Image — manual GCS upload (same path as inline editor images) */}
      <EditorSidebarSection title={SIDEBAR_SECTIONS["FEATURED_IMAGE"]} icon={<FiImage className="h-3.5 w-3.5" />}>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            id={COVER_UPLOAD["INPUT_ID"]}
            type="file"
            accept={COVER_UPLOAD["ACCEPT"]}
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploadingCover}
          />

          {formData.cover_image ? (
            <div className="space-y-2">
              <div className="relative h-28 w-full overflow-hidden rounded-md border border-border bg-muted">
                {uploadingCover ? (
                  <Skeleton className="h-full w-full rounded-md" />
                ) : imageError ? (
                  cachedBase64 ? (
                    <LazyImage
                      src={cachedBase64}
                      alt={EDITOR_UI["COVER_PREVIEW_CACHED_ALT"]}
                      viewportLazy={false}
                      className="h-full w-full object-cover"
                      containerClassName="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 p-3 text-center">
                      <FiAlertTriangle className="h-5 w-5 text-warning" />
                      <p className="text-[10px] font-semibold leading-tight text-foreground">
                        {SYNC_LABEL["PREVIEW_UNAVAILABLE"]}
                      </p>
                      <p className="max-w-[180px] text-[9px] leading-normal text-muted-foreground">
                        {SYNC_LABEL["STORAGE_VIEWER_ROLE_HINT"]}
                      </p>
                    </div>
                  )
                ) : (
                  <LazyImage
                    src={formData.cover_image}
                    alt={EDITOR_UI["COVER_PREVIEW_ALT"]}
                    viewportLazy={false}
                    className="h-full w-full object-cover"
                    containerClassName="h-full w-full"
                    onImageError={() => setImageError(true)}
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={BUTTON_VARIANTS["OUTLINE"]}
                  size={BUTTON_SIZES["SM"]}
                  onClick={openFilePicker}
                  disabled={uploadingCover}
                  className="min-h-[44px] touch-manipulation sm:min-h-0"
                >
                  <FiUpload className="mr-1.5 h-3.5 w-3.5" />
                  {uploadingCover ? EDITOR_UI["COVER_UPLOADING"] : EDITOR_UI["COVER_UPLOAD_CHANGE"]}
                </Button>
                <Button
                  type="button"
                  variant={BUTTON_VARIANTS["GHOST"]}
                  size={BUTTON_SIZES["SM"]}
                  onClick={() => onCoverImageChange("")}
                  disabled={uploadingCover}
                  aria-label={EDITOR_UI["COVER_REMOVE_ARIA"]}
                  className="min-h-[44px] touch-manipulation sm:min-h-0"
                >
                  {EDITOR_UI["COVER_UPLOAD_REMOVE"]}
                </Button>
              </div>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === EDITOR_KEYS["ENTER"] || e.key === EDITOR_KEYS["SPACE"]) {
                  e.preventDefault();
                  openFilePicker();
                }
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              aria-label={EDITOR_UI["COVER_UPLOAD_DROPZONE_TITLE"]}
              className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-3 py-4 text-center transition-colors touch-manipulation ${
                dragOver
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
              } ${uploadingCover ? "pointer-events-none opacity-70" : ""}`}
            >
              {uploadingCover ? (
                <Skeleton className="h-16 w-full rounded-md" />
              ) : (
                <>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FiUpload className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-medium text-foreground">{EDITOR_UI["COVER_UPLOAD_DROPZONE_TITLE"]}</p>
                  <p className="text-[10px] text-muted-foreground">{EDITOR_UI["COVER_UPLOAD_DROPZONE_HINT"]}</p>
                  <Button
                    type="button"
                    variant={BUTTON_VARIANTS["PRIMARY"]}
                    size={BUTTON_SIZES["SM"]}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      openFilePicker();
                    }}
                    className="mt-1 min-h-[44px] touch-manipulation sm:min-h-0"
                  >
                    {EDITOR_UI["COVER_UPLOAD_BROWSE"]}
                  </Button>
                </>
              )}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">{EDITOR_UI["COVER_UPLOAD_OR_URL"]}</p>
          <Input
            name="cover_image"
            type="url"
            value={formData.cover_image}
            onChange={onInputChange}
            placeholder={SYNC_LABEL["PLACEHOLDER_COVER_IMAGE"]}
            className="text-xs"
            size="sm"
            disabled={uploadingCover}
          />
        </div>
      </EditorSidebarSection>

      {/* Canonical URL */}
      <EditorSidebarSection title={SIDEBAR_SECTIONS["CANONICAL_URL"]} icon={<FiLink className="h-3.5 w-3.5" />}>
        <Input
          name="canonical_url"
          type="url"
          value={formData.canonical_url}
          onChange={onInputChange}
          placeholder={SYNC_LABEL["PLACEHOLDER_CANONICAL_URL"]}
          className="text-xs"
          size="sm"
        />
      </EditorSidebarSection>

      {/* SEO Score */}
      <EditorSidebarSection
        title={SIDEBAR_SECTIONS["SEO_SCORE"]}
        icon={<FiBarChart2 className="h-3.5 w-3.5" />}
        defaultOpen={true}
      >
        {contentLoading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <ul className="space-y-2">
              {Array.from({ length: SEO_RING["SKELETON_CHECK_COUNT"] }, (_, i) => (
                <li key={`seo-skeleton-${i}`} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
                  <Skeleton className="h-3 flex-1" />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <SeoRing score={seo.score} maxScore={seo.maxScore} />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {seo.score}/{seo.maxScore}
                </p>
                <p className="text-xs text-muted-foreground">{SIDEBAR_SECTIONS["SEO_SCORE"]}</p>
              </div>
            </div>
            <ul className="space-y-1">
              {seo.checks.map((check) => (
                <li key={check.label} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 shrink-0">
                    {check.ok === true ? (
                      <FiCheckCircle className="h-3 w-3 text-green-500" />
                    ) : check.ok === false ? (
                      check.warning ? (
                        <FiAlertTriangle className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <FiAlertCircle className="h-3 w-3 text-red-500" />
                      )
                    ) : (
                      <span className="h-px w-3 bg-muted" />
                    )}
                  </span>
                  <span className="text-muted-foreground">{check.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </EditorSidebarSection>
    </>
  );

  if (isDesktop) {
    return (
      <aside className="editor-sidebar-left">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">{SIDEBAR_SECTIONS["POST_SETTINGS"]}</h2>
        </div>
        {panelContent}
      </aside>
    );
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="editor-drawer-root" role="presentation">
      <button
        type="button"
        className="editor-drawer-backdrop"
        aria-label={EDITOR_UI["CLOSE_POST_SETTINGS_DRAWER"]}
        onClick={onClose}
      />
      <aside
        className="editor-sidebar-left-drawer-paper editor-drawer-panel editor-drawer-panel-left"
        style={{ maxWidth: EDITOR_LAYOUT["LEFT_DRAWER_WIDTH_PX"] }}
        role="dialog"
        aria-modal="true"
        aria-label={EDITOR_UI["POST_SETTINGS_DRAWER_TITLE"]}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">{EDITOR_UI["POST_SETTINGS_DRAWER_TITLE"]}</h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={EDITOR_UI["CLOSE_POST_SETTINGS_DRAWER"]}
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{panelContent}</div>
        </div>
      </aside>
    </div>
  );
};

export default EditorSidebarLeft;
