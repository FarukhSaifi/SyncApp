"use client";

import SuggestionError from "@components/editor/SuggestionError";
import type { KeywordResearchItem, KeywordResearchSectionProps } from "@types";
import { formatDateTime } from "@utils/dateUtils";
import { FiSearch, FiZap } from "react-icons/fi";

import { KEYWORD_SCORE } from "@constants/ai";
import { EDITOR_KEYS } from "@constants/editor";
import { EDITOR_UI } from "@constants/messages";

import Button from "@components/common/Button";
import Input from "@components/common/Input";

function researchCardClass(isSelected: boolean): string {
  const base =
    "group flex w-full flex-col gap-2 rounded-lg border p-3 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
  return isSelected
    ? `${base} border-primary bg-primary/10 text-foreground shadow-sm`
    : `${base} border-border bg-background hover:border-primary/40 hover:bg-muted/40`;
}

function ScoreBar({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const clamped = Math.max(KEYWORD_SCORE.MIN, Math.min(KEYWORD_SCORE.MAX, value));
  const fill = invert ? KEYWORD_SCORE.MAX - clamped : clamped;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums text-foreground/80">{clamped}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={KEYWORD_SCORE.MIN}
        aria-valuemax={KEYWORD_SCORE.MAX}
        aria-valuenow={clamped}
        className="h-1 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${fill}%` }} />
      </div>
    </div>
  );
}

export default function KeywordResearchSection({
  seed,
  onSeedChange,
  results,
  loading,
  error,
  cached,
  updatedAt,
  selectedKeyword,
  onResearch,
  onPick,
  disabled = false,
}: KeywordResearchSectionProps) {
  const trimmedSelected = selectedKeyword.trim().toLowerCase();

  return (
    <section
      className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3.5 dark:bg-muted/10"
      aria-labelledby="keyword-research-heading"
    >
      <div>
        <h3
          id="keyword-research-heading"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground"
        >
          <FiSearch className="h-3.5 w-3.5 text-primary" aria-hidden />
          {EDITOR_UI["KEYWORD_RESEARCH_TITLE"]}
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">{EDITOR_UI["KEYWORD_RESEARCH_HINT"]}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label
            htmlFor="keyword-research-seed"
            className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {EDITOR_UI["KEYWORD_RESEARCH_SEED_LABEL"]}
          </label>
          <Input
            id="keyword-research-seed"
            value={seed}
            onChange={(e) => onSeedChange(e.target.value)}
            placeholder={EDITOR_UI["KEYWORD_RESEARCH_SEED_PLACEHOLDER"]}
            className="text-sm"
            size="sm"
            disabled={disabled || loading}
            onKeyDown={(e) => {
              if (e.key === EDITOR_KEYS["ENTER"] && seed.trim() && !loading) {
                e.preventDefault();
                onResearch();
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={disabled || loading || !seed.trim()}
          onClick={onResearch}
          className="shrink-0 justify-center"
          aria-busy={loading}
        >
          <FiZap className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-pulse" : ""}`} aria-hidden />
          {loading ? EDITOR_UI["KEYWORD_RESEARCH_LOADING"] : EDITOR_UI["KEYWORD_RESEARCH_BUTTON"]}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">{EDITOR_UI["KEYWORD_RESEARCH_SCORES_NOTE"]}</p>
      {results.length > 0 ? (
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {cached ? EDITOR_UI["KEYWORD_RESEARCH_CACHED"] : EDITOR_UI["KEYWORD_RESEARCH_LIVE"]}
          {updatedAt ? ` · ${EDITOR_UI["TRENDING_TOPICS_UPDATED_PREFIX"]} ${formatDateTime(updatedAt)}` : ""}
        </p>
      ) : null}
      {error ? (
        <SuggestionError message={error} />
      ) : loading && results.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">{EDITOR_UI["KEYWORD_RESEARCH_LOADING"]}</p>
      ) : results.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">{EDITOR_UI["KEYWORD_RESEARCH_EMPTY"]}</p>
      ) : (
        <div
          className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2"
          role="listbox"
          aria-label={EDITOR_UI["KEYWORD_RESEARCH_TITLE"]}
        >
          {results.map((item: KeywordResearchItem) => {
            const isSelected = trimmedSelected === item.keyword.toLowerCase();
            return (
              <button
                key={item.keyword}
                type="button"
                role="option"
                disabled={disabled || loading}
                onClick={() => onPick(item)}
                className={researchCardClass(isSelected)}
                aria-selected={isSelected}
                aria-pressed={isSelected}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium leading-snug text-foreground">{item.keyword}</span>
                  <span className="shrink-0 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                    {EDITOR_UI["KEYWORD_RESEARCH_OPPORTUNITY"]} {item.opportunityScore}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ScoreBar label={EDITOR_UI["KEYWORD_RESEARCH_INTENT"]} value={item.commercialIntent} />
                  <ScoreBar label={EDITOR_UI["KEYWORD_RESEARCH_COMPETITION"]} value={item.competition} invert />
                </div>
                {item.monetizationAngle ? (
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground/80">{EDITOR_UI["KEYWORD_RESEARCH_ANGLE"]}:</span>{" "}
                    {item.monetizationAngle}
                  </p>
                ) : null}
                <p className="text-[10px] capitalize text-muted-foreground">{item.intentLabel}</p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
