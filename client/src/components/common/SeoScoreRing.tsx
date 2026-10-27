import type { SeoScoreRingProps } from "@types";

import { SEO_RING, SEO_THRESHOLDS } from "@constants/seo";

/**
 * Circular SEO score indicator shared by editor sidebar and dashboard table.
 * Matches editor ring geometry/colors from SEO_RING + RING_* thresholds.
 */
const SeoScoreRing = ({ score, maxScore }: SeoScoreRingProps) => {
  const pct = maxScore > 0 ? score / maxScore : 0;
  const r = SEO_RING["RADIUS"];
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  const color =
    pct >= SEO_THRESHOLDS["RING_GOOD_RATIO"]
      ? SEO_RING["COLOR_GOOD"]
      : pct >= SEO_THRESHOLDS["RING_MID_RATIO"]
        ? SEO_RING["COLOR_MID"]
        : SEO_RING["COLOR_WEAK"];

  return (
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
          r={r}
          fill="none"
          stroke={SEO_RING["TRACK_STROKE"]}
          strokeWidth={SEO_RING["STROKE_WIDTH"]}
        />
        <circle
          cx={SEO_RING["CENTER"]}
          cy={SEO_RING["CENTER"]}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={SEO_RING["STROKE_WIDTH"]}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
};

export default SeoScoreRing;
