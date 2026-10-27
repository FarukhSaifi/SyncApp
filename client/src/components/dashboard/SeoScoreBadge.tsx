import { memo, useMemo } from "react";

import type { SeoScoreBadgeProps } from "@types";
import { parseSeoScoreSummary } from "@utils/seoScorecard";

import { SEO_TOOLTIP_CONTENT_CLASS } from "@constants/designTokens";
import { SYNC_LABEL } from "@constants/messages";
import { SEO_RING, SEO_THRESHOLDS } from "@constants/seo";

import SeoScoreBreakdown from "@components/common/SeoScoreBreakdown";
import SeoScoreRing from "@components/common/SeoScoreRing";
import Tooltip from "@components/common/Tooltip";

/**
 * Dashboard SEO column cell — circular ring matching the editor score,
 * reading persisted `seo_score` (no list-side recompute).
 * Portal tooltip shows the colored OK/WARN/FAIL breakdown like the editor.
 */
const SeoScoreBadge = memo<SeoScoreBadgeProps>(({ post }) => {
  const score = typeof post.seo_score === "number" ? post.seo_score : null;
  const maxScore = SEO_THRESHOLDS.SCORE_MAX;
  const summary = (post.seo_score_summary || "").trim();
  const checks = useMemo(() => parseSeoScoreSummary(summary), [summary]);

  if (score === null) {
    return (
      <Tooltip content={SYNC_LABEL.SEO_SCORE_PENDING} side="top" portal>
        <span className="inline-flex cursor-help" tabIndex={0} role="img" aria-label={SYNC_LABEL.SEO_SCORE_PENDING}>
          <div className="relative shrink-0" style={{ width: SEO_RING["SIZE"], height: SEO_RING["SIZE"] }}>
            <svg
              className="-rotate-90"
              width={SEO_RING["SIZE"]}
              height={SEO_RING["SIZE"]}
              viewBox={`0 0 ${SEO_RING["SIZE"]} ${SEO_RING["SIZE"]}`}
              aria-hidden
            >
              <circle
                cx={SEO_RING["CENTER"]}
                cy={SEO_RING["CENTER"]}
                r={SEO_RING["RADIUS"]}
                fill="none"
                stroke={SEO_RING["TRACK_STROKE"]}
                strokeWidth={SEO_RING["STROKE_WIDTH"]}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
              {SYNC_LABEL.SEO_SCORE_UNKNOWN}
            </span>
          </div>
        </span>
      </Tooltip>
    );
  }

  const tip = <SeoScoreBreakdown checks={checks} score={score} maxScore={maxScore} showHeader />;

  return (
    <Tooltip content={tip} side="top" portal contentClassName={SEO_TOOLTIP_CONTENT_CLASS}>
      <span
        className="inline-flex cursor-help"
        tabIndex={0}
        role="img"
        aria-label={SYNC_LABEL.SEO_SCORE_ARIA(score, maxScore, summary)}
      >
        <SeoScoreRing score={score} maxScore={maxScore} />
      </span>
    </Tooltip>
  );
});

SeoScoreBadge.displayName = "SeoScoreBadge";

export default SeoScoreBadge;
