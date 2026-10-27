import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EDITOR_UI } from "@constants/messages";

import { EditorContentSkeleton, EditorPreviewSkeleton, ImagePreviewSkeleton } from "./EditorSkeletons";

describe("EditorSkeletons", () => {
  it("renders editor content skeleton with busy label", () => {
    render(<EditorContentSkeleton />);
    expect(screen.getByLabelText(EDITOR_UI.LOADING_EDITOR_ARIA)).toBeInTheDocument();
  });

  it("renders preview skeleton", () => {
    render(<EditorPreviewSkeleton />);
    expect(screen.getByLabelText(EDITOR_UI.LOADING_PREVIEW_ARIA)).toBeInTheDocument();
  });

  it("renders image preview skeleton", () => {
    const { container } = render(<ImagePreviewSkeleton />);
    expect(container.querySelector("[aria-hidden='true']")).toBeTruthy();
  });
});
