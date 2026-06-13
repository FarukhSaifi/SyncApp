"use client";

import { useMemo } from "react";

import type { GeneratePostModalProps } from "@types";
import { FiHash, FiTrendingUp, FiZap } from "react-icons/fi";

import { EDITOR_UI } from "@constants/messages";
import { DEVTO_HIGH_REACH_TAGS, DEVTO_TRENDING_TOPICS } from "@constants/seo";

import Button from "@components/common/Button";
import Input from "@components/common/Input";
import Modal from "@components/common/Modal";

function topicCardClass(isSelected: boolean): string {
  const base =
    "group flex w-full items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
  return isSelected
    ? `${base} border-primary bg-primary/10 text-foreground shadow-sm`
    : `${base} border-border bg-background hover:border-primary/40 hover:bg-muted/40`;
}

export default function GeneratePostModal({
  isOpen,
  onClose,
  keyword,
  onKeywordChange,
  onGenerate,
  isGenerating,
}: GeneratePostModalProps) {
  const trimmedKeyword = keyword.trim();
  const canGenerate = trimmedKeyword.length > 0 && !isGenerating;

  const selectedTopic = useMemo(
    () => DEVTO_TRENDING_TOPICS.find((topic) => topic === trimmedKeyword) ?? null,
    [trimmedKeyword],
  );

  const handleGenerate = () => {
    if (!canGenerate) return;
    onGenerate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={EDITOR_UI.GENERATE_POST_MODAL_TITLE}
      description={EDITOR_UI.GENERATE_POST_MODAL_DESC}
      size="lg"
      closeOnOverlayClick={!isGenerating}
      closeOnEscape={!isGenerating}
      footer={
        <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isGenerating}>
            {EDITOR_UI.GENERATE_POST_CANCEL}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="min-w-[140px] justify-center"
          >
            <FiZap className="h-3.5 w-3.5 mr-1.5" />
            {isGenerating ? EDITOR_UI.GENERATING_POST : EDITOR_UI.GENERATE_POST_CONFIRM}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground">
            {EDITOR_UI.GENERATE_POST_KEYWORD_LABEL}
          </label>
          <Input
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder={EDITOR_UI.GENERATE_POST_KEYWORD_PLACEHOLDER}
            className="text-sm"
            size="sm"
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canGenerate) handleGenerate();
            }}
          />
          {!trimmedKeyword && (
            <p className="text-[11px] text-muted-foreground">{EDITOR_UI.GENERATE_POST_KEYWORD_REQUIRED}</p>
          )}
          {selectedTopic && (
            <p className="text-[11px] text-primary">
              <FiTrendingUp className="inline h-3 w-3 mr-1" />
              {selectedTopic}
            </p>
          )}
        </div>

        <section className="space-y-2.5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {EDITOR_UI.TRENDING_TOPICS_TITLE}
            </h3>
            <p className="mt-1 text-[11px] text-muted-foreground">{EDITOR_UI.TRENDING_TOPICS_HINT}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DEVTO_TRENDING_TOPICS.map((topic) => {
              const isSelected = trimmedKeyword === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => onKeywordChange(topic)}
                  className={topicCardClass(isSelected)}
                  aria-pressed={isSelected}
                >
                  <FiTrendingUp
                    className={`mt-0.5 h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}
                  />
                  <span className="leading-snug">{topic}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3.5 dark:bg-muted/10">
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
              <FiHash className="h-3.5 w-3.5 text-primary" />
              {EDITOR_UI.REACH_TAGS_TITLE}
            </h3>
            <p className="mt-1 text-[11px] text-muted-foreground">{EDITOR_UI.REACH_TAGS_HINT}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DEVTO_HIGH_REACH_TAGS.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}
