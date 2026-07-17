"use client";

import { FiCopy, FiLinkedin } from "react-icons/fi";

import Button from "@components/common/Button";
import { EDITOR_UI } from "@constants/messages";

type LinkedInPostPanelProps = {
  linkedinPost: string | null;
  linkedinReadMoreUrl: string | null;
  linkedinMissingCanonical: boolean;
  onCopy: () => void;
  disabled?: boolean;
};

export default function LinkedInPostPanel({
  linkedinPost,
  linkedinReadMoreUrl,
  linkedinMissingCanonical,
  onCopy,
  disabled = false,
}: LinkedInPostPanelProps) {
  if (!linkedinPost?.trim()) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 dark:bg-muted/10">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
          <FiLinkedin className="h-3.5 w-3.5 text-primary" />
          {EDITOR_UI.LINKEDIN_POST_TITLE}
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">{EDITOR_UI.LINKEDIN_POST_EMPTY}</p>
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

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCopy}
        disabled={disabled}
        className="w-full justify-center"
      >
        <FiCopy className="mr-1.5 h-3.5 w-3.5" />
        {EDITOR_UI.LINKEDIN_POST_COPY}
      </Button>
    </div>
  );
}
