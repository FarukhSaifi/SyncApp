"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import KeywordResearchSection from "@components/editor/KeywordResearchSection";
import SuggestionError from "@components/editor/SuggestionError";
import type { AiReachTagsSource, AiTopicsSource, GeneratePostModalProps, KeywordResearchItem } from "@types";
import { apiClient } from "@utils/apiClient";
import { formatDateTime } from "@utils/dateUtils";
import { FiCheck, FiChevronDown, FiHash, FiRefreshCw, FiSearch, FiTrendingUp, FiZap } from "react-icons/fi";

import { AI_SUGGESTION_SOURCES, EDITOR_KEYS, GENERATE_POST_MODAL } from "@constants/editor";
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
  researchContext,
  onResearchPick,
  onSelectSuggestionKeyword,
}: GeneratePostModalProps) {
  const trimmedKeyword = keyword.trim();
  const hasTargets = targetPlatforms.length > 0;
  const canGenerate = trimmedKeyword.length > 0 && hasTargets && !isGenerating;

  const [seed, setSeed] = useState<string>("");
  const [researchResults, setResearchResults] = useState<KeywordResearchItem[]>([]);
  const [researchLoading, setResearchLoading] = useState<boolean>(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [researchCached, setResearchCached] = useState<boolean>(false);
  const [researchUpdatedAt, setResearchUpdatedAt] = useState<string | null>(null);

  const [topics, setTopics] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [topicsSource, setTopicsSource] = useState<AiTopicsSource | null>(null);
  const [topicsCached, setTopicsCached] = useState<boolean>(false);
  const [topicsUpdatedAt, setTopicsUpdatedAt] = useState<string | null>(null);
  const [topicsLoading, setTopicsLoading] = useState<boolean>(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [reachTags, setReachTags] = useState<string[]>([]);
  const [reachTagsSource, setReachTagsSource] = useState<AiReachTagsSource | null>(null);
  const [reachTagsLoading, setReachTagsLoading] = useState<boolean>(false);
  const [reachTagsError, setReachTagsError] = useState<string | null>(null);

  async function runKeywordResearch() {
    const trimmedSeed = seed.trim();
    if (!trimmedSeed || researchLoading || isGenerating) {
      return;
    }
    setResearchLoading(true);
    setResearchError(null);
    try {
      const res = await apiClient.aiKeywordResearch(trimmedSeed);
      const next = res.data?.keywords;
      if (!Array.isArray(next) || next.length === 0) {
        throw new Error(EDITOR_UI["KEYWORD_RESEARCH_ERROR"]);
      }
      setResearchResults(next);
      setResearchCached(Boolean(res.data?.cached));
      setResearchUpdatedAt(typeof res.data?.updatedAt === "string" ? res.data.updatedAt : null);
    } catch (err) {
      setResearchResults([]);
      setResearchCached(false);
      setResearchUpdatedAt(null);
      const apiMessage = err instanceof Error ? err.message.trim() : "";
      setResearchError(apiMessage || EDITOR_UI["KEYWORD_RESEARCH_ERROR"]);
    } finally {
      setResearchLoading(false);
    }
  }

  async function loadTrendingTopics(refresh: boolean) {
    setTopicsLoading(true);
    setTopicsError(null);
    try {
      const res = await apiClient.aiTrendingTopics(refresh);
      const nextTopics = res.data?.topics;
      const nextKeywords = res.data?.keywords;
      if (
        res.data?.source !== AI_SUGGESTION_SOURCES["GOOGLE_SEARCH"] ||
        !Array.isArray(nextTopics) ||
        nextTopics.length === 0 ||
        !Array.isArray(nextKeywords) ||
        nextKeywords.length === 0
      ) {
        throw new Error(EDITOR_UI["TRENDING_TOPICS_UNAVAILABLE"]);
      }

      setTopics(nextTopics);
      setKeywords(nextKeywords);
      setTopicsSource(AI_SUGGESTION_SOURCES["GOOGLE_SEARCH"]);
      setTopicsCached(Boolean(res.data?.cached));
      setTopicsUpdatedAt(typeof res.data?.updatedAt === "string" ? res.data.updatedAt : null);
    } catch (err) {
      setTopics([]);
      setKeywords([]);
      setTopicsSource(null);
      setTopicsCached(false);
      setTopicsUpdatedAt(null);
      // Prefer the API message (e.g. depleted AI Studio credits) over a generic hint.
      const apiMessage = err instanceof Error ? err.message.trim() : "";
      setTopicsError(apiMessage || EDITOR_UI["TRENDING_TOPICS_ERROR"]);
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
      if (res.data?.source !== AI_SUGGESTION_SOURCES["DEVTO"] || !Array.isArray(nextTags) || nextTags.length === 0) {
        throw new Error(EDITOR_UI["REACH_TAGS_UNAVAILABLE"]);
      }
      setReachTags(nextTags);
      setReachTagsSource(AI_SUGGESTION_SOURCES["DEVTO"]);
    } catch {
      setReachTags([]);
      setReachTagsSource(null);
      setReachTagsError(EDITOR_UI["REACH_TAGS_ERROR"]);
    } finally {
      setReachTagsLoading(false);
    }
  }

  const onOpenLoadSuggestions = useEffectEvent(() => {
    void loadTrendingTopics(false);
    void loadReachTags(false);
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
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

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const activeModel = useMemo(() => models.find((m) => m.id === selectedModel) || models[0], [models, selectedModel]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === EDITOR_KEYS["ESCAPE"]) {
        setIsModelDropdownOpen(false);
      }
    };
    if (isModelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModelDropdownOpen]);

  const toggleTarget = (platform: string) => {
    if (targetPlatforms.includes(platform)) {
      const next = targetPlatforms.filter((p) => p !== platform);
      onTargetPlatformsChange(next);
      return;
    }
    onTargetPlatformsChange([...targetPlatforms, platform]);
  };

  const handleGenerate = () => {
    if (!canGenerate) {
      return;
    }
    onGenerate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={EDITOR_UI["GENERATE_POST_MODAL_TITLE"]}
      description={EDITOR_UI["GENERATE_POST_MODAL_DESC"]}
      size={GENERATE_POST_MODAL["SIZE"]}
      closeOnOverlayClick={!isGenerating}
      closeOnEscape={!isGenerating}
      footer={
        <div className={GENERATE_POST_MODAL["FOOTER"]}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isGenerating}
            className={GENERATE_POST_MODAL["CANCEL_BTN"]}
          >
            {EDITOR_UI["GENERATE_POST_CANCEL"]}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={GENERATE_POST_MODAL["GENERATE_BTN"]}
          >
            <FiZap className="mr-1.5 h-3.5 w-3.5" />
            {isGenerating ? EDITOR_UI["GENERATING_POST"] : EDITOR_UI["GENERATE_POST_CONFIRM"]}
          </Button>
        </div>
      }
    >
      <div className={GENERATE_POST_MODAL["ROOT"]}>
        <section className={GENERATE_POST_MODAL["SECTION"]}>
          <h3 className={GENERATE_POST_MODAL["SECTION_TITLE"]}>{EDITOR_UI["GENERATE_POST_SECTION_SETUP"]}</h3>
          <div className={GENERATE_POST_MODAL["SETUP_GRID"]}>
            <div className="space-y-1.5">
              <label
                htmlFor="generate-post-model"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground"
              >
                {EDITOR_UI["GENERATE_POST_MODEL_LABEL"]}
              </label>
              <div className="relative" ref={modelDropdownRef}>
                <button
                  type="button"
                  id="generate-post-model"
                  onClick={() => !isGenerating && setIsModelDropdownOpen((prev) => !prev)}
                  disabled={isGenerating}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3.5 py-2.5 text-left shadow-sm transition-all hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
                  aria-haspopup="listbox"
                  aria-expanded={isModelDropdownOpen}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="truncate text-sm font-medium text-foreground">
                      {activeModel?.label || selectedModel}
                    </div>
                    {activeModel?.description ? (
                      <div className="truncate text-xs text-muted-foreground">{activeModel.description}</div>
                    ) : null}
                  </div>
                  <FiChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isModelDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isModelDropdownOpen ? (
                  <div
                    role="listbox"
                    aria-label={EDITOR_UI["SELECT_AI_MODEL_ARIA"]}
                    className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-2xl border border-border/80 bg-popover p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95"
                  >
                    <div className="space-y-1">
                      {models.map((model) => {
                        const isSelected = model.id === selectedModel;
                        return (
                          <button
                            key={model.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              onModelChange(model.id);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`group flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left transition-all ${
                              isSelected
                                ? "border border-border bg-muted/60 text-foreground shadow-sm"
                                : "border border-transparent text-foreground/90 hover:border-border/60 hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                              {isSelected ? <FiCheck className="h-4 w-4 text-foreground" /> : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium leading-tight text-foreground">{model.label}</div>
                              {model.description ? (
                                <div className="mt-0.5 text-xs text-muted-foreground">{model.description}</div>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-foreground">
                {EDITOR_UI["GENERATE_POST_TARGETS_LABEL"]}
              </span>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {EDITOR_UI["GENERATE_POST_TARGETS_HINT"]}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <label className={platformCheckboxClass(targetPlatforms.includes(OPTIMIZATION_TARGETS["DEVTO"]))}>
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/40"
                    checked={targetPlatforms.includes(OPTIMIZATION_TARGETS["DEVTO"])}
                    onChange={() => toggleTarget(OPTIMIZATION_TARGETS["DEVTO"])}
                    disabled={isGenerating}
                  />
                  {EDITOR_UI["GENERATE_POST_TARGET_DEVTO"]}
                </label>
                <label className={platformCheckboxClass(targetPlatforms.includes(OPTIMIZATION_TARGETS["LINKEDIN"]))}>
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/40"
                    checked={targetPlatforms.includes(OPTIMIZATION_TARGETS["LINKEDIN"])}
                    onChange={() => toggleTarget(OPTIMIZATION_TARGETS["LINKEDIN"])}
                    disabled={isGenerating}
                  />
                  {EDITOR_UI["GENERATE_POST_TARGET_LINKEDIN"]}
                </label>
                <label className={platformCheckboxClass(targetPlatforms.includes(OPTIMIZATION_TARGETS["GOOGLE"]))}>
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/40"
                    checked={targetPlatforms.includes(OPTIMIZATION_TARGETS["GOOGLE"])}
                    onChange={() => toggleTarget(OPTIMIZATION_TARGETS["GOOGLE"])}
                    disabled={isGenerating}
                  />
                  {EDITOR_UI["GENERATE_POST_TARGET_GOOGLE"]}
                </label>
              </div>
              {!hasTargets ? (
                <p className="text-[11px] text-destructive">{EDITOR_UI["GENERATE_POST_TARGETS_REQUIRED"]}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className={GENERATE_POST_MODAL["SECTION"]}>
          <h3 className={GENERATE_POST_MODAL["SECTION_TITLE"]}>{EDITOR_UI["GENERATE_POST_SECTION_TOPIC"]}</h3>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground">
              {EDITOR_UI["GENERATE_POST_KEYWORD_LABEL"]}
            </label>
            <Input
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              placeholder={EDITOR_UI["GENERATE_POST_KEYWORD_PLACEHOLDER"]}
              className="text-sm"
              size="sm"
              disabled={isGenerating}
              onKeyDown={(e) => {
                if (e.key === EDITOR_KEYS["ENTER"] && canGenerate) {
                  handleGenerate();
                }
              }}
            />
            {!trimmedKeyword ? (
              <p className="text-[11px] text-muted-foreground">{EDITOR_UI["GENERATE_POST_KEYWORD_REQUIRED"]}</p>
            ) : null}
            {researchContext?.monetizationAngle ? (
              <p className="text-[11px] text-primary">
                <FiZap className="mr-1 inline h-3 w-3" />
                {EDITOR_UI["KEYWORD_RESEARCH_SELECTED"]}: {researchContext.monetizationAngle}
              </p>
            ) : null}
            {!researchContext && selectedTopic ? (
              <p className="text-[11px] text-primary">
                <FiTrendingUp className="mr-1 inline h-3 w-3" />
                {selectedTopic}
              </p>
            ) : null}
            {!researchContext && !selectedTopic && selectedGoogleKeyword ? (
              <p className="text-[11px] text-primary">
                <FiSearch className="mr-1 inline h-3 w-3" />
                {selectedGoogleKeyword}
              </p>
            ) : null}
          </div>
        </section>

        <section className={GENERATE_POST_MODAL["SECTION"]}>
          <div className="flex items-center justify-between gap-2">
            <h3 className={GENERATE_POST_MODAL["SECTION_TITLE"]}>{EDITOR_UI["GENERATE_POST_SECTION_DISCOVER"]}</h3>
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
                className={`mr-1.5 h-3.5 w-3.5 ${topicsLoading || reachTagsLoading ? "animate-spin" : ""}`}
              />
              {EDITOR_UI["TRENDING_TOPICS_REFRESH"]}
            </Button>
          </div>

          <div className={GENERATE_POST_MODAL["DISCOVER_GRID"]}>
            <div className={GENERATE_POST_MODAL["PANEL"]}>
              <KeywordResearchSection
                seed={seed}
                onSeedChange={setSeed}
                results={researchResults}
                loading={researchLoading}
                error={researchError}
                cached={researchCached}
                updatedAt={researchUpdatedAt}
                selectedKeyword={trimmedKeyword}
                onResearch={() => void runKeywordResearch()}
                onPick={onResearchPick}
                disabled={isGenerating}
              />
            </div>

            <div className={GENERATE_POST_MODAL["PANEL"]}>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {EDITOR_UI["TRENDING_TOPICS_TITLE"]}
                </h4>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {topicsSource === AI_SUGGESTION_SOURCES["GOOGLE_SEARCH"]
                    ? EDITOR_UI["TRENDING_TOPICS_LIVE_HINT"]
                    : EDITOR_UI["TRENDING_TOPICS_HINT"]}
                </p>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {topicsSource === AI_SUGGESTION_SOURCES["GOOGLE_SEARCH"]
                  ? topicsCached
                    ? EDITOR_UI["TRENDING_TOPICS_SOURCE_CACHED"]
                    : EDITOR_UI["TRENDING_TOPICS_SOURCE_LIVE"]
                  : EDITOR_UI["TRENDING_TOPICS_PENDING"]}
                {topicsSource === AI_SUGGESTION_SOURCES["GOOGLE_SEARCH"] && topicsUpdatedAt
                  ? ` · ${EDITOR_UI["TRENDING_TOPICS_UPDATED_PREFIX"]} ${formatDateTime(topicsUpdatedAt)}`
                  : ""}
              </p>
              {topicsError ? (
                <SuggestionError message={topicsError} />
              ) : topicsLoading && topics.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">{EDITOR_UI["TRENDING_TOPICS_LOADING"]}</p>
              ) : topics.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">{EDITOR_UI["TRENDING_TOPICS_EMPTY"]}</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {topics.map((topic) => {
                    const isSelected = trimmedKeyword === topic;
                    return (
                      <button
                        key={topic}
                        type="button"
                        disabled={isGenerating || topicsLoading}
                        onClick={() => onSelectSuggestionKeyword(topic)}
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
            </div>

            <div className={GENERATE_POST_MODAL["PANEL"]}>
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                  <FiSearch className="h-3.5 w-3.5 text-primary" />
                  {EDITOR_UI["GOOGLE_KEYWORDS_TITLE"]}
                </h4>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {topicsSource === AI_SUGGESTION_SOURCES["GOOGLE_SEARCH"]
                    ? EDITOR_UI["GOOGLE_KEYWORDS_LIVE_HINT"]
                    : EDITOR_UI["GOOGLE_KEYWORDS_HINT"]}
                </p>
              </div>
              {topicsError ? (
                <SuggestionError message={topicsError} />
              ) : topicsLoading && keywords.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">{EDITOR_UI["TRENDING_TOPICS_LOADING"]}</p>
              ) : keywords.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">{EDITOR_UI["GOOGLE_KEYWORDS_EMPTY"]}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((kw) => {
                    const isSelected = trimmedKeyword.toLowerCase() === kw.toLowerCase();
                    return (
                      <button
                        key={kw}
                        type="button"
                        disabled={isGenerating || topicsLoading}
                        onClick={() => onSelectSuggestionKeyword(kw)}
                        className={keywordChipClass(isSelected)}
                        aria-pressed={isSelected}
                      >
                        {kw}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={GENERATE_POST_MODAL["PANEL"]}>
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                  <FiHash className="h-3.5 w-3.5 text-primary" />
                  {EDITOR_UI["REACH_TAGS_TITLE"]}
                </h4>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {reachTagsSource === AI_SUGGESTION_SOURCES["DEVTO"]
                    ? EDITOR_UI["REACH_TAGS_LIVE_HINT"]
                    : EDITOR_UI["REACH_TAGS_HINT"]}
                </p>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {reachTagsSource === AI_SUGGESTION_SOURCES["DEVTO"]
                  ? EDITOR_UI["REACH_TAGS_SOURCE_LIVE"]
                  : EDITOR_UI["REACH_TAGS_PENDING"]}
              </p>
              {reachTagsError ? (
                <SuggestionError message={reachTagsError} />
              ) : reachTagsLoading && reachTags.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">{EDITOR_UI["REACH_TAGS_LOADING"]}</p>
              ) : reachTags.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">{EDITOR_UI["REACH_TAGS_EMPTY"]}</p>
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
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
