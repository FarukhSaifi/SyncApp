import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SYNC_LABEL } from "@constants/messages";
import { SEO_IMPROVE_APPLY, SEO_IMPROVE_FIELDS } from "@constants/seo";

import SeoImproveReviewModal from "./SeoImproveReviewModal";

afterEach(() => {
  cleanup();
});

const baseItem = {
  id: "title",
  field: SEO_IMPROVE_FIELDS.TITLE,
  issue: "Title too short",
  currentValue: "Hi",
  value: "A much better SEO title for the post",
  applyMode: SEO_IMPROVE_APPLY.REPLACE,
  selected: true,
};

describe("SeoImproveReviewModal", () => {
  it("shows proposed text", () => {
    render(
      <SeoImproveReviewModal isOpen onClose={vi.fn()} items={[baseItem]} onToggleItem={vi.fn()} onApply={vi.fn()} />,
    );
    expect(screen.getByText(baseItem.value)).toBeInTheDocument();
    expect(screen.getByText(SYNC_LABEL["SEO_IMPROVE_PROPOSED"])).toBeInTheDocument();
  });

  it("disables Apply when none selected", () => {
    render(
      <SeoImproveReviewModal
        isOpen
        onClose={vi.fn()}
        items={[{ ...baseItem, selected: false }]}
        onToggleItem={vi.fn()}
        onApply={vi.fn()}
      />,
    );
    const apply = screen.getByText(SYNC_LABEL["SEO_IMPROVE_APPLY_SELECTED"]).closest("button");
    expect(apply).toBeDisabled();
  });

  it("calls dismiss callback", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <SeoImproveReviewModal isOpen onClose={onClose} items={[baseItem]} onToggleItem={vi.fn()} onApply={vi.fn()} />,
    );
    await user.click(screen.getByText(SYNC_LABEL["SEO_IMPROVE_DISMISS"]));
    expect(onClose).toHaveBeenCalled();
  });
});
