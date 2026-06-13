"use client";
import React, { useMemo, useState } from "react";

import type { EditorSidebarLeftProps } from "@types";
import { getSeoScorecard } from "@utils/seoScorecard";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiChevronDown,
  FiImage,
  FiLink,
  FiTag,
  FiX,
} from "react-icons/fi";

import { SIDEBAR_SECTIONS } from "@constants/editor";
import { SYNC_LABEL } from "@constants/messages";
import { SEO_THRESHOLDS } from "@constants/seo";

import Button from "@components/common/Button";
import Input from "@components/common/Input";
import LazyImage from "@components/common/LazyImage";
import Skeleton from "@components/common/Skeleton";

/** Collapsible sidebar section */
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

/** SEO Score ring indicator */
const SeoRing = ({ score, maxScore }: { score: number; maxScore: number }) => {
  const pct = maxScore > 0 ? score / maxScore : 0;
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  const color = pct >= 0.7 ? "hsl(142, 71%, 45%)" : pct >= 0.4 ? "hsl(25, 95%, 53%)" : "hsl(0, 84%, 60%)";

  return (
    <div className="seo-score-ring">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
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
  formData,
  tagList,
  tagInput,
  setTagInput,
  onInputChange,
  onAddTag,
  onRemoveTag,
  onTagKeyDown,
  contentLoading = false,
}: EditorSidebarLeftProps) => {
  const [imageError, setImageError] = useState(false);
  const [lastCover, setLastCover] = useState(formData.cover_image);
  const [cachedBase64, setCachedBase64] = useState<string | null>(null);

  React.useEffect(() => {
    if (formData.cover_image && typeof window !== "undefined") {
      const cached = sessionStorage.getItem(`cover_preview_${formData.cover_image}`);
      setCachedBase64(cached);
    } else {
      setCachedBase64(null);
    }
  }, [formData.cover_image]);

  if (formData.cover_image !== lastCover) {
    setImageError(false);
    setLastCover(formData.cover_image);
  }

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

  const tagsAtLimit = tagList.length >= SEO_THRESHOLDS.TAG_COUNT_MAX;

  return (
    <aside className={`editor-sidebar-left ${isOpen ? "open" : ""}`}>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{SIDEBAR_SECTIONS.POST_SETTINGS}</h2>
      </div>

      {/* Tags */}
      <Section title={SIDEBAR_SECTIONS.TAGS} icon={<FiTag className="h-3.5 w-3.5" />}>
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">{SYNC_LABEL.TAGS_HELP}</p>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
              onKeyDown={onTagKeyDown}
              placeholder={SYNC_LABEL.ADD_TAG}
              className="flex-1 text-xs"
              size="sm"
              disabled={tagsAtLimit}
            />
            <Button type="button" variant="default" size="sm" onClick={onAddTag} disabled={tagsAtLimit}>
              {SYNC_LABEL.ADD}
            </Button>
          </div>
          {tagsAtLimit && (
            <p className="text-[10px] text-yellow-600 dark:text-yellow-500">{SYNC_LABEL.TAGS_LIMIT_REACHED}</p>
          )}
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => onRemoveTag(tag)}
                    className="p-0.5 rounded hover:bg-primary/20 focus:outline-none"
                    aria-label={`Remove ${tag}`}
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Meta Description */}
      <Section title={SYNC_LABEL.META_DESCRIPTION_LABEL} icon={<FiCheckCircle className="h-3.5 w-3.5" />}>
        <div className="space-y-2">
          <textarea
            name="meta_description"
            value={formData.meta_description || ""}
            onChange={onInputChange}
            placeholder={SYNC_LABEL.META_DESCRIPTION_PLACEHOLDER}
            rows={3}
            className="w-full text-xs rounded-md border border-border bg-background px-2 py-1.5 resize-y focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>
              {SYNC_LABEL.CHARACTERS}
              {formData.meta_description?.length || 0}
            </span>
            <span
              className={
                formData.meta_description?.length >= 120 && formData.meta_description?.length <= 150
                  ? "text-green-500"
                  : "text-yellow-500"
              }
            >
              {SYNC_LABEL.AIM_SEO}
            </span>
          </div>
        </div>
      </Section>

      {/* Featured Image */}
      <Section title={SIDEBAR_SECTIONS.FEATURED_IMAGE} icon={<FiImage className="h-3.5 w-3.5" />}>
        <div className="space-y-2">
          <Input
            name="cover_image"
            type="url"
            value={formData.cover_image}
            onChange={onInputChange}
            placeholder={SYNC_LABEL.PLACEHOLDER_COVER_IMAGE}
            className="text-xs"
            size="sm"
          />
          {formData.cover_image && (
            <div className="relative w-full h-28 rounded-md overflow-hidden border border-border bg-muted">
              {imageError ? (
                cachedBase64 ? (
                  <LazyImage
                    src={cachedBase64}
                    alt="Cover preview (cached)"
                    viewportLazy={false}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                ) : (
                  <div className="p-3 text-center flex flex-col items-center justify-center gap-1 h-full">
                    <FiAlertTriangle className="h-5 w-5 text-yellow-500" />
                    <p className="text-[10px] font-semibold text-foreground leading-tight">
                      {SYNC_LABEL.PREVIEW_UNAVAILABLE}
                    </p>
                    <p className="text-[9px] text-muted-foreground leading-normal max-w-[180px]">
                      {SYNC_LABEL.STORAGE_VIEWER_ROLE_HINT}
                    </p>
                  </div>
                )
              ) : (
                <LazyImage
                  src={formData.cover_image}
                  alt="Cover preview"
                  viewportLazy={false}
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                  onImageError={() => setImageError(true)}
                />
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Canonical URL */}
      <Section title={SIDEBAR_SECTIONS.CANONICAL_URL} icon={<FiLink className="h-3.5 w-3.5" />}>
        <Input
          name="canonical_url"
          type="url"
          value={formData.canonical_url}
          onChange={onInputChange}
          placeholder="https://yourblog.com/post-slug"
          className="text-xs"
          size="sm"
        />
      </Section>

      {/* SEO Score */}
      <Section title={SIDEBAR_SECTIONS.SEO_SCORE} icon={<FiBarChart2 className="h-3.5 w-3.5" />} defaultOpen={true}>
        {contentLoading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <ul className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={`seo-skeleton-${i}`} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full shrink-0" />
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
                <p className="text-xs text-muted-foreground">{SIDEBAR_SECTIONS.SEO_SCORE}</p>
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
                      <span className="w-3 h-px bg-muted" />
                    )}
                  </span>
                  <span className="text-muted-foreground">{check.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
    </aside>
  );
};

export default EditorSidebarLeft;
