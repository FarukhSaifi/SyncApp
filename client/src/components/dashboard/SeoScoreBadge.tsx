import { memo, useMemo } from "react";

import { COLOR_CLASSES, SEO_THRESHOLDS, SYNC_LABEL } from "@constants";
import type { SeoScoreBadgeProps } from "@types";
import { getSeoScorecard } from "@utils/seoScorecard";

import { PILL_SIZES } from "@constants/designTokens";

import Tooltip from "@components/common/Tooltip";

/**
 * Small badge showing SEO score (e.g. "SEO: 92/100") with tooltip listing checks.
 */
const SeoScoreBadge = memo<SeoScoreBadgeProps>(({ post }) => {
  const { score, maxScore, summary } = useMemo(() => getSeoScorecard(post), [post]);

  const scoreColor =
    score >= SEO_THRESHOLDS.BADGE_GOOD_MIN
      ? COLOR_CLASSES.ICON_COLOR.POSITIVE
      : score >= SEO_THRESHOLDS.BADGE_MID_MIN
        ? COLOR_CLASSES.ICON_COLOR.WARNING
        : COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE;

  const label = `${SYNC_LABEL.SEO_BADGE_LABEL}: ${score}/${maxScore}`;
  const tip = summary || SYNC_LABEL.SEO_SCORE_UNKNOWN;

  return (
    <Tooltip content={<span className="whitespace-pre-wrap text-left">{tip}</span>} side="top">
      <span
        className={`${PILL_SIZES.SM} cursor-help border border-border bg-muted/80 text-foreground ${scoreColor}`}
        tabIndex={0}
        role="img"
        aria-label={SYNC_LABEL.SEO_SCORE_ARIA(score, maxScore, summary)}
      >
        {label}
      </span>
    </Tooltip>
  );
});

SeoScoreBadge.displayName = "SeoScoreBadge";

export default SeoScoreBadge;
