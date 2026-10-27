import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { SYNC_LABEL } from "@constants/messages";

import TagChips from "./TagChips";

describe("TagChips", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows empty label when no tags", () => {
    render(<TagChips tags={[]} limit={0} />);
    expect(screen.getByText(SYNC_LABEL.NO_TAGS)).toBeInTheDocument();
  });

  it("renders visible tags within limit", () => {
    render(<TagChips tags={["react", "nextjs"]} limit={2} />);
    expect(screen.getByText("#react")).toBeInTheDocument();
    expect(screen.getByText("#nextjs")).toBeInTheDocument();
  });

  it("shows overflow more control with tooltip content", async () => {
    render(<TagChips tags={["a", "b", "c", "d"]} limit={2} />);
    expect(screen.getByText(SYNC_LABEL.TAGS_MORE(2))).toBeInTheDocument();
    await userEvent.hover(screen.getByText(SYNC_LABEL.TAGS_MORE(2)));
    expect(await screen.findByText("#c")).toBeInTheDocument();
    expect(screen.getByText("#d")).toBeInTheDocument();
  });
});
