"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";

import type { GeneratePostModalProps } from "@types";
import { apiClient } from "@utils/apiClient";
import { FiHash, FiRefreshCw, FiSearch, FiTrendingUp, FiZap } from "react-icons/fi";

import { EDITOR_UI } from "@constants/messages";
import { OPTIMIZATION_TARGETS } from "@constants/platforms";

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

function keywordChipClass(isSelected: boolean): string {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60";
  return isSelected
    ? `${base} border-primary bg-primary/15 text-foreground`
    : `${base} border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/40`;
}

function platformCheckboxClass(checked: boolean): string {
  const base = "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors";
  return checked
    ? `${base} border-primary bg-primary/10 text-foreground`
    : `${base} border-border bg-background hover:border-primary/40 hover:bg-muted/40`;
}

function SuggestionError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-[11px] text-destructive">
      {message}
    </div>
  );
}

export default function GeneratePostModal({
  isOpen,
  onClose,
  keyword,
  onKeywordChange,
  selectedModel,
  onModelChange,
  models,
  targetPlatforms,
  onTargetPlatformsChange,
  onGenerate,
  isGenerating,
}: GeneratePostModalProps) {
  const trimmedKeyword = keyword.trim();
  const hasTargets = targetPlatforms.length > 0;
  const canGenerate = trimmedKeyword.length > 0 && hasTargets && !isGenerating;

  const [topics, setTopics] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [topicsSource, setTopicsSource] = useState<"google_search" | null>(null);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [reachTags, setReachTags] = useState<string[]>([]);
  const [reachTagsSource, setReachTagsSource] = useState<"devto" | null>(null);
  const [reachTagsLoading, setReachTagsLoading] = useState(false);
  const [reachTagsError, setReachTagsError] = useState<string | null>(null);

  async function loadTrendingTopics(refresh: boolean) {
    setTopicsLoading(true);
    setTopicsError(null);
    try {
      const res = await apiClient.aiTrendingTopics(refresh);
      const nextTopics = res.data?.topics;
      const nextKeywords = res.data?.keywords;
      if (
        res.data?.source !== "google_search" ||
        !Array.isArray(nextTopics) ||
        nextTopics.length === 0 ||
        !Array.isArray(nextKeywords) ||
        nextKeywords.length === 0
      ) {
        throw new Error("Live Google topics unavailable");
      }

      setTopics(nextTopics);
      setKeywords(nextKeywords);
      setTopicsSource("google_search");
    } catch {
      setTopics([]);
      setKeywords([]);
      setTopicsSource(null);
      setTopicsError(EDITOR_UI.TRENDING_TOPICS_ERROR);
    } finally {
      setTopicsLoading(false);
    }
  }

  async function loadReachTags(refresh: boolean) {
    setReachTagsLoading(true);
    setReachTagsError(null);
    try {
      const res = await apiClient.aiDevtoTags(refresh);
      const nextTags = res.data?.tags;
      if (res.data?.source !== "devto" || !Array.isArray(nextTags) || nextTags.length === 0) {
        throw new Error("Live DEV.to tags unavailable");
      }
      setReachTags(nextTags);
      setReachTagsSource("devto");
    } catch {
      setReachTags([]);
      setReachTagsSource(null);
      setReachTagsError(EDITOR_UI.REACH_TAGS_ERROR);
    } finally {
      setReachTagsLoading(false);
    }
  }

  const onOpenLoadSuggestions = useEffectEvent(() => {
    void loadTrendingTopics(false);
    void loadReachTags(false);
  });

  useEffect(() => {
    if (!isOpen) return;
    onOpenLoadSuggestions();
  }, [isOpen]);

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic === trimmedKeyword) ?? null,
    [topics, trimmedKeyword],
  );

  const selectedGoogleKeyword = useMemo(
    () => keywords.find((k) => k.toLowerCase() === trimmedKeyword.toLowerCase()) ?? null,
    [keywords, trimmedKeyword],
  );

  const toggleTarget = (platform: string) => {
    if (targetPlatforms.includes(platform)) {
      const next = targetPlatforms.filter((p) => p !== platform);
      onTargetPlatformsChange(next);
      return;
    }
    onTargetPlatformsChange([...targetPlatforms, platform]);
  };

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="generate-post-model"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              {EDITOR_UI.GENERATE_POST_MODEL_LABEL}
            </label>
            <select
              id="generate-post-model"
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={isGenerating}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-foreground">
              {EDITOR_UI.GENERATE_POST_TARGETS_LABEL}
            </span>
            <p className="text-[11px] text-muted-foreground">{EDITOR_UI.GENERATE_POST_TARGETS_HINT}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <label className={platformCheckboxClass(targetPlatforms.includes(OPTIMIZATION_TARGETS.DEVTO))}>
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/40"
                  checked={targetPlatforms.includes(OPTIMIZATION_TARGETS.DEVTO)}
                  onChange={() => toggleTarget(OPTIMIZATION_TARGETS.DEVTO)}
                  disabled={isGenerating}
                />
                {EDITOR_UI.GENERATE_POST_TARGET_DEVTO}
              </label>
              <label className={platformCheckboxClass(targetPlatforms.includes(OPTIMIZATION_TARGETS.LINKEDIN))}>
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/40"
                  checked={targetPlatforms.includes(OPTIMIZATION_TARGETS.LINKEDIN)}
                  onChange={() => toggleTarget(OPTIMIZATION_TARGETS.LINKEDIN)}
                  disabled={isGenerating}
                />
                {EDITOR_UI.GENERATE_POST_TARGET_LINKEDIN}
              </label>
            </div>
            {!hasTargets && <p className="text-[11px] text-destructive">{EDITOR_UI.GENERATE_POST_TARGETS_REQUIRED}</p>}
          </div>
        </div>

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
          {!selectedTopic && selectedGoogleKeyword && (
            <p className="text-[11px] text-primary">
              <FiSearch className="inline h-3 w-3 mr-1" />
              {selectedGoogleKeyword}
            </p>
          )}
        </div>

        <section className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {EDITOR_UI.TRENDING_TOPICS_TITLE}
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {topicsSource === "google_search"
                  ? EDITOR_UI.TRENDING_TOPICS_LIVE_HINT
                  : EDITOR_UI.TRENDING_TOPICS_HINT}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isGenerating || topicsLoading || reachTagsLoading}
              onClick={() => {
                void loadTrendingTopics(true);
                void loadReachTags(true);
              }}
              className="shrink-0"
            >
              <FiRefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${topicsLoading || reachTagsLoading ? "animate-spin" : ""}`}
              />
              {EDITOR_UI.TRENDING_TOPICS_REFRESH}
            </Button>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {topicsSource === "google_search"
              ? EDITOR_UI.TRENDING_TOPICS_SOURCE_LIVE
              : EDITOR_UI.TRENDING_TOPICS_PENDING}
          </p>
          {topicsError ? (
            <SuggestionError message={topicsError} />
          ) : topicsLoading && topics.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">{EDITOR_UI.TRENDING_TOPICS_LOADING}</p>
          ) : topics.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">{EDITOR_UI.TRENDING_TOPICS_EMPTY}</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {topics.map((topic) => {
                const isSelected = trimmedKeyword === topic;
                return (
                  <button
                    key={topic}
                    type="button"
                    disabled={isGenerating || topicsLoading}
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
          )}
        </section>

        <section className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3.5 dark:bg-muted/10">
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
              <FiSearch className="h-3.5 w-3.5 text-primary" />
              {EDITOR_UI.GOOGLE_KEYWORDS_TITLE}
            </h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {topicsSource === "google_search" ? EDITOR_UI.GOOGLE_KEYWORDS_LIVE_HINT : EDITOR_UI.GOOGLE_KEYWORDS_HINT}
            </p>
          </div>
          {topicsError ? (
            <SuggestionError message={topicsError} />
          ) : topicsLoading && keywords.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">{EDITOR_UI.TRENDING_TOPICS_LOADING}</p>
          ) : keywords.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">{EDITOR_UI.GOOGLE_KEYWORDS_EMPTY}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw) => {
                const isSelected = trimmedKeyword.toLowerCase() === kw.toLowerCase();
                return (
                  <button
                    key={kw}
                    type="button"
                    disabled={isGenerating || topicsLoading}
                    onClick={() => onKeywordChange(kw)}
                    className={keywordChipClass(isSelected)}
                    aria-pressed={isSelected}
                  >
                    {kw}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3.5 dark:bg-muted/10">
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
              <FiHash className="h-3.5 w-3.5 text-primary" />
              {EDITOR_UI.REACH_TAGS_TITLE}
            </h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {reachTagsSource === "devto" ? EDITOR_UI.REACH_TAGS_LIVE_HINT : EDITOR_UI.REACH_TAGS_HINT}
            </p>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {reachTagsSource === "devto" ? EDITOR_UI.REACH_TAGS_SOURCE_LIVE : EDITOR_UI.REACH_TAGS_PENDING}
          </p>
          {reachTagsError ? (
            <SuggestionError message={reachTagsError} />
          ) : reachTagsLoading && reachTags.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">{EDITOR_UI.REACH_TAGS_LOADING}</p>
          ) : reachTags.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">{EDITOR_UI.REACH_TAGS_EMPTY}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {reachTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
