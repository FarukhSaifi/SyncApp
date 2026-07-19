"use client";

import { FiCopy, FiLinkedin, FiRefreshCw, FiSend, FiZap } from "react-icons/fi";

import { BUTTON_LABELS, EDITOR_UI, INFO_MESSAGES } from "@constants/messages";

import Button from "@components/common/Button";

type LinkedInPostPanelProps = {
  linkedinPost: string | null;
  linkedinReadMoreUrl: string | null;
  linkedinMissingCanonical: boolean;
  linkedinConnected: boolean;
  publishing?: boolean;
  generating?: boolean;
  onCopy: () => void;
  onPublish: () => void;
  onGenerate: () => void;
  disabled?: boolean;
};

export default function LinkedInPostPanel({
  linkedinPost,
  linkedinReadMoreUrl,
  linkedinMissingCanonical,
  linkedinConnected,
  publishing = false,
  generating = false,
  onCopy,
  onPublish,
  onGenerate,
  disabled = false,
}: LinkedInPostPanelProps) {
  if (!linkedinPost?.trim()) {
    return (
      <div className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3 dark:bg-muted/10">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
          <FiLinkedin className="h-3.5 w-3.5 text-primary" />
          {EDITOR_UI.LINKEDIN_POST_TITLE}
        </h3>
        <p className="text-[11px] text-muted-foreground">{EDITOR_UI.LINKEDIN_POST_EMPTY}</p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onGenerate}
          disabled={disabled || generating}
          className="w-full justify-center"
        >
          <FiZap className="mr-1.5 h-3.5 w-3.5" />
          {generating ? EDITOR_UI.LINKEDIN_POST_GENERATING : EDITOR_UI.LINKEDIN_POST_GENERATE}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3 dark:bg-muted/10">
      <div>
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
          <FiLinkedin className="h-3.5 w-3.5 text-primary" />
          {EDITOR_UI.LINKEDIN_POST_TITLE}
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">{EDITOR_UI.LINKEDIN_POST_HINT}</p>
      </div>

      <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-background p-2.5 text-[11px] leading-relaxed text-foreground">
        {linkedinPost}
      </pre>

      {linkedinReadMoreUrl ? (
        <p className="text-[10px] text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">{EDITOR_UI.LINKEDIN_POST_READ_MORE_LABEL}: </span>
          <a
            href={linkedinReadMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-primary underline-offset-2 hover:underline"
          >
            {linkedinReadMoreUrl}
          </a>
        </p>
      ) : null}

      {linkedinMissingCanonical ? (
        <p className="rounded-md border border-warning/30 bg-warning/10 p-2 text-[11px] text-foreground">
          {EDITOR_UI.LINKEDIN_POST_MISSING_CANONICAL}
        </p>
      ) : null}

      {!linkedinConnected ? (
        <p className="text-[11px] text-muted-foreground">{BUTTON_LABELS.LINKEDIN_CONNECT_HINT}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCopy}
          disabled={disabled || publishing || generating}
          className="w-full justify-center"
        >
          <FiCopy className="mr-1.5 h-3.5 w-3.5" />
          {EDITOR_UI.LINKEDIN_POST_COPY}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onPublish}
          disabled={disabled || publishing || generating || !linkedinConnected}
          className="w-full justify-center"
        >
          <FiSend className="mr-1.5 h-3.5 w-3.5" />
          {publishing ? INFO_MESSAGES.PUBLISHING : EDITOR_UI.LINKEDIN_POST_PUBLISH}
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onGenerate}
        disabled={disabled || publishing || generating}
        className="w-full justify-center"
      >
        <FiRefreshCw className={`mr-1.5 h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
        {generating ? EDITOR_UI.LINKEDIN_POST_GENERATING : EDITOR_UI.LINKEDIN_POST_REGENERATE}
      </Button>
    </div>
  );
}
