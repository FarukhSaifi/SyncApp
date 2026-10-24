"use client";

import { DATA_TABLE, SYNC_LABEL } from "@constants";
import type { TagChipsProps } from "@types";

import { TOOLTIP_UI } from "@constants/designTokens";

import Tooltip from "./Tooltip";

/**
 * Compact tag list with overflow “+N more” tooltip listing the remaining tags.
 */
export default function TagChips({
  tags,
  limit,
  className = "",
  chipClassName = "",
  emptyLabel = SYNC_LABEL.NO_TAGS,
}: TagChipsProps) {
  if (!tags.length) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  const visible = tags.slice(0, limit);
  const overflow = tags.slice(limit);
  const chipClass = `${DATA_TABLE.TAG_CHIP} ${chipClassName}`.trim();

  return (
    <div className={`${DATA_TABLE.TAG_WRAP} ${className}`.trim()}>
      {visible.map((tag) => (
        <span key={tag} className={chipClass} title={`#${tag}`}>
          #{tag}
        </span>
      ))}
      {overflow.length > 0 ? (
        <Tooltip
          side="top"
          aria-label={SYNC_LABEL.TAGS_OVERFLOW_TOOLTIP_ARIA(overflow.length)}
          content={
            <div className={TOOLTIP_UI.CONTENT_LIST}>
              {overflow.map((tag) => (
                <span key={tag} className={TOOLTIP_UI.CHIP}>
                  #{tag}
                </span>
              ))}
            </div>
          }
        >
          <span className={DATA_TABLE.TAG_MORE} tabIndex={0}>
            {SYNC_LABEL.TAGS_MORE(overflow.length)}
          </span>
        </Tooltip>
      ) : null}
    </div>
  );
}
