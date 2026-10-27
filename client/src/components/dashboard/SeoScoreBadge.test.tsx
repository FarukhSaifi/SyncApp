import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Post } from "@types";
import { afterEach, describe, expect, it } from "vitest";

import { SYNC_LABEL } from "@constants/messages";

import SeoScoreBadge from "./SeoScoreBadge";

const basePost: Post = {
  _id: "p1",
  title: "Post",
  content_markdown: "",
  status: "draft",
  tags: [],
  author: "u1",
};

describe("SeoScoreBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows pending ring when seo_score is missing", () => {
    render(<SeoScoreBadge post={basePost} />);
    expect(screen.getByLabelText(SYNC_LABEL.SEO_SCORE_PENDING)).toBeInTheDocument();
    expect(screen.getByText(SYNC_LABEL.SEO_SCORE_UNKNOWN)).toBeInTheDocument();
  });

  it("shows score ring and breakdown tooltip when score exists", async () => {
    const user = userEvent.setup();
    render(
      <SeoScoreBadge
        post={{
          ...basePost,
          seo_score: 72,
          seo_score_summary: "Title length: OK | Meta missing: FAIL",
        }}
      />,
    );
    const summary = "Title length: OK | Meta missing: FAIL";
    const aria = SYNC_LABEL.SEO_SCORE_ARIA(72, 100, summary);
    expect(screen.getByLabelText(aria)).toBeInTheDocument();
    await user.hover(screen.getByLabelText(aria));
    expect(await screen.findByText(/72\/100/)).toBeInTheDocument();
  });
});
