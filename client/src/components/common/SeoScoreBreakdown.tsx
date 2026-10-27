import type { SeoCategoryId, SeoScoreBreakdownProps } from "@types";
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

import { COLOR_CLASSES } from "@constants/colorClasses";
import { SIDEBAR_SECTIONS } from "@constants/editor";
import { SYNC_LABEL } from "@constants/messages";
import { SEO_CATEGORIES, SEO_CATEGORY_LABELS, SEO_HELPER_COPY } from "@constants/seo";

function CheckIcon({ ok, warning }: { ok: boolean | null; warning?: boolean }) {
  if (ok === true) {
    return <FiCheckCircle className={`h-3 w-3 shrink-0 ${COLOR_CLASSES.ICON_COLOR.POSITIVE}`} />;
  }
  if (ok === false) {
    if (warning) {
      return <FiAlertTriangle className={`h-3 w-3 shrink-0 ${COLOR_CLASSES.ICON_COLOR.WARNING}`} />;
    }
    return <FiAlertCircle className={`h-3 w-3 shrink-0 ${COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE}`} />;
  }
  return <span className="mt-1.5 h-px w-3 shrink-0 bg-muted" />;
}

function checkLabelClass(ok: boolean | null, warning?: boolean): string {
  if (ok === true) {
    return COLOR_CLASSES.ALERT_TEXT.POSITIVE;
  }
  if (ok === false) {
    return warning ? COLOR_CLASSES.ALERT_TEXT.WARNING : COLOR_CLASSES.ALERT_TEXT.DESTRUCTIVE;
  }
  return "text-muted-foreground";
}

/**
 * Editor-matched SEO checklist with green (pass) / orange (warn) / red (fail) coloring.
 */
export default function SeoScoreBreakdown({
  checks,
  categories,
  score,
  maxScore,
  showHeader = false,
  className = "",
}: SeoScoreBreakdownProps) {
  const groups =
    categories && categories.length > 0
      ? categories.filter((g) => g.checks.length > 0)
      : (Object.values(SEO_CATEGORIES) as SeoCategoryId[])
          .map((id) => ({
            id,
            checks: checks.filter((c) => c.category === id),
          }))
          .filter((g) => g.checks.length > 0);

  const flatFallback = groups.length === 0 ? checks : null;

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {showHeader && typeof score === "number" && typeof maxScore === "number" ? (
        <div className="space-y-1 border-b border-border pb-2">
          <p className="text-sm font-semibold text-foreground">
            {SIDEBAR_SECTIONS["SEO_SCORE"]}: {score}/{maxScore}
          </p>
          <p className="text-[10px] leading-snug text-muted-foreground">{SEO_HELPER_COPY["DENSITY_NOTE"]}</p>
        </div>
      ) : null}

      {flatFallback ? (
        <ul className="space-y-1">
          {flatFallback.map((check) => (
            <li key={check.label} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5">
                <CheckIcon ok={check.ok} warning={check.warning} />
              </span>
              <span className={checkLabelClass(check.ok, check.warning)}>{check.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <div key={group.id} className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {SEO_CATEGORY_LABELS[group.id]}
              </p>
              <ul className="space-y-1">
                {group.checks.map((check) => (
                  <li key={`${group.id}-${check.label}`} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5">
                      <CheckIcon ok={check.ok} warning={check.warning} />
                    </span>
                    <span className={checkLabelClass(check.ok, check.warning)}>{check.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {checks.length === 0 ? <p className="text-xs text-muted-foreground">{SYNC_LABEL.SEO_SCORE_UNKNOWN}</p> : null}
    </div>
  );
}
