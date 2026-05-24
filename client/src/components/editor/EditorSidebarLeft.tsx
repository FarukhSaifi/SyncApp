"use client";
import React, { useMemo, useState } from "react";
import { FiChevronDown, FiImage, FiLink, FiTag, FiX, FiBarChart2, FiCheckCircle, FiAlertTriangle, FiAlertCircle } from "react-icons/fi";

import Input from "@components/common/Input";
import Button from "@components/common/Button";

import { getSeoScorecard } from "@utils/seoScorecard";

import { SIDEBAR_SECTIONS } from "@constants/editor";
import { SYNC_LABEL } from "@constants/messages";
import type { EditorFormData } from "@hooks/useEditorState";

interface EditorSidebarLeftProps {
  isOpen: boolean;
  formData: EditorFormData;
  tagList: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

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

/** SEO Score ring indicator */
const SeoRing = ({ score, maxScore }: { score: number; maxScore: number }) => {
  const pct = maxScore > 0 ? score / maxScore : 0;
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  const color =
    pct >= 0.7 ? "hsl(142, 71%, 45%)" : pct >= 0.4 ? "hsl(25, 95%, 53%)" : "hsl(0, 84%, 60%)";

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
}: EditorSidebarLeftProps) => {
  const seo = useMemo(
    () =>
      getSeoScorecard({
        title: formData.title,
        tags: tagList,
        cover_image: formData.cover_image,
        canonical_url: formData.canonical_url,
        content_markdown: formData.content_markdown,
      }),
    [formData.title, tagList, formData.cover_image, formData.canonical_url, formData.content_markdown],
  );

  return (
    <aside className={`editor-sidebar-left ${isOpen ? "open" : ""}`}>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{SIDEBAR_SECTIONS.POST_SETTINGS}</h2>
      </div>

      {/* Tags */}
      <Section title={SIDEBAR_SECTIONS.TAGS} icon={<FiTag className="h-3.5 w-3.5" />}>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
              onKeyDown={onTagKeyDown}
              placeholder={SYNC_LABEL.ADD_TAG}
              className="flex-1 text-xs"
              size="sm"
            />
            <Button type="button" variant="default" size="sm" onClick={onAddTag}>
              {SYNC_LABEL.ADD}
            </Button>
          </div>
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
      <Section title="Meta Description" icon={<FiCheckCircle className="h-3.5 w-3.5" />}>
        <div className="space-y-2">
          <textarea
            name="meta_description"
            value={formData.meta_description || ""}
            onChange={onInputChange as any}
            placeholder="A brief summary for SEO (120-160 chars)"
            rows={3}
            className="w-full text-xs rounded-md border border-border bg-background px-2 py-1.5 resize-y focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Characters: {formData.meta_description?.length || 0}</span>
            <span className={formData.meta_description?.length >= 120 && formData.meta_description?.length <= 160 ? "text-green-500" : "text-yellow-500"}>Aim: 120-160</span>
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
            <img
              src={formData.cover_image}
              alt="Cover preview"
              className="w-full h-28 object-cover rounded-md border border-border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
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
            {seo.checks.map((check, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs">
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
      </Section>
    </aside>
  );
};

export default EditorSidebarLeft;
