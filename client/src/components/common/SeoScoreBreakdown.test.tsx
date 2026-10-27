import { cleanup, render, screen } from "@testing-library/react";
import type { SeoCheck } from "@types";
import { afterEach, describe, expect, it } from "vitest";

import { SYNC_LABEL } from "@constants/messages";
import { SEO_CATEGORIES } from "@constants/seo";

import SeoScoreBreakdown from "./SeoScoreBreakdown";

const checks: SeoCheck[] = [
  { label: "Title length", ok: true, category: SEO_CATEGORIES.METADATA },
  { label: "Meta missing", ok: false, category: SEO_CATEGORIES.METADATA },
  { label: "Keyword density", ok: false, warning: true, category: SEO_CATEGORIES.STRUCTURE },
  { label: "Optional hint", ok: null, category: SEO_CATEGORIES.TRUST },
];

describe("SeoScoreBreakdown", () => {
  afterEach(() => {
    cleanup();
  });

  it("groups checks by SEO category", () => {
    render(<SeoScoreBreakdown checks={checks} />);
    expect(screen.getByText("Title length")).toBeInTheDocument();
    expect(screen.getByText("Meta missing")).toBeInTheDocument();
    expect(screen.getByText("Keyword density")).toBeInTheDocument();
    expect(screen.getByText("Optional hint")).toBeInTheDocument();
  });

  it("shows score header when requested", () => {
    render(<SeoScoreBreakdown checks={checks} score={72} maxScore={100} showHeader />);
    expect(screen.getByText(/72\/100/)).toBeInTheDocument();
  });

  it("renders unknown label when no checks", () => {
    render(<SeoScoreBreakdown checks={[]} />);
    expect(screen.getByText(SYNC_LABEL.SEO_SCORE_UNKNOWN)).toBeInTheDocument();
  });

  it("uses explicit categories when provided", () => {
    render(
      <SeoScoreBreakdown
        checks={[{ label: "Custom only", ok: true, category: SEO_CATEGORIES.METADATA }]}
        categories={[
          {
            id: SEO_CATEGORIES.METADATA,
            checks: [{ label: "Custom only", ok: true, category: SEO_CATEGORIES.METADATA }],
          },
        ]}
      />,
    );
    expect(screen.getByText("Custom only")).toBeInTheDocument();
  });

  it("falls back to flat list when category groups are empty", () => {
    render(
      <SeoScoreBreakdown
        checks={[{ label: "Uncategorized pass", ok: true, category: SEO_CATEGORIES.METADATA }]}
        categories={[{ id: SEO_CATEGORIES.STRUCTURE, checks: [] }]}
      />,
    );
    expect(screen.getByText("Uncategorized pass")).toBeInTheDocument();
  });

  it("renders neutral check styling for ok null", () => {
    render(<SeoScoreBreakdown checks={[{ label: "Neutral item", ok: null, category: SEO_CATEGORIES.TRUST }]} />);
    expect(screen.getByText("Neutral item")).toHaveClass("text-muted-foreground");
  });
});
