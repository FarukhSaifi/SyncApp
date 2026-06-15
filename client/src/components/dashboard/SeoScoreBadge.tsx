import { memo, useMemo } from "react";

import { COLOR_CLASSES, SYNC_LABEL } from "@constants";
import type { SeoScoreBadgeProps } from "@types";
import { getSeoScorecard } from "@utils/seoScorecard";

import { PILL_SIZES } from "@constants/designTokens";

/**
 * Small badge showing SEO score (e.g. "SEO: 92/100") with tooltip listing checks.
 * Hover shows: ✅ Keyword in title, ✅ Meta description length, ⚠️ No internal links, etc.
 */
const SeoScoreBadge = memo<SeoScoreBadgeProps>(({ post }) => {
  const { score, maxScore, summary } = useMemo(() => getSeoScorecard(post), [post]);

  const scoreColor =
    score >= 80
      ? COLOR_CLASSES.ICON_COLOR.POSITIVE
      : score >= 50
        ? COLOR_CLASSES.ICON_COLOR.WARNING
        : COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE;

  return (
    <span
      className={`${PILL_SIZES.SM} bg-muted/80 text-foreground border border-border ${scoreColor}`}
      title={summary || SYNC_LABEL.SEO_SCORE_UNKNOWN}
      role="img"
      aria-label={SYNC_LABEL.SEO_SCORE_ARIA(score, maxScore, summary)}
    >
      {SYNC_LABEL.SEO_BADGE_LABEL}: {score}/{maxScore}
    </span>
  );
});

SeoScoreBadge.displayName = "SeoScoreBadge";

export default SeoScoreBadge;
