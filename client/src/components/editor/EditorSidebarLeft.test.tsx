import React from "react";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiClient } from "@utils/apiClient";
import { afterEach, describe, expect, it, vi } from "vitest";

import { INITIAL_EDITOR_FORM } from "@constants/editor";
import { SIDEBAR_SECTIONS } from "@constants/editor";
import { EDITOR_UI, SYNC_LABEL } from "@constants/messages";

const mediaQueryMock = vi.fn(() => true);

vi.mock("@hooks/useMediaQuery", () => ({
  useMediaQuery: () => mediaQueryMock(),
}));

const sidebarToast = {
  success: vi.fn(),
  error: vi.fn(),
  apiError: vi.fn(),
  apiSuccess: vi.fn(),
  apiLoading: vi.fn(() => "toast-id"),
  removeToast: vi.fn(),
};

vi.mock("@hooks/useToast", () => ({
  useToast: () => sidebarToast,
}));

vi.mock("@utils/apiClient", () => ({
  apiClient: {
    uploadImage: vi.fn(),
  },
}));


import EditorSidebarLeft from "./EditorSidebarLeft";

describe("EditorSidebarLeft", () => {
  afterEach(() => {
    cleanup();
    mediaQueryMock.mockReturnValue(true);
  });

  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    formData: {
      ...INITIAL_EDITOR_FORM,
      title: "Test post",
      content_markdown: "# Hello\n\nBody",
      meta_description: "Meta",
    },
    tagList: ["react"],
    tagInput: "",
    setTagInput: vi.fn(),
    onInputChange: vi.fn(),
    onCoverImageChange: vi.fn(),
    onAddTag: vi.fn(),
    onRemoveTag: vi.fn(),
    onTagKeyDown: vi.fn(),
    seoPrimaryKeyword: "react",
    seoPlatforms: ["devto"],
    onImproveWithAi: vi.fn(),
  };

  it("renders post settings sections on desktop", () => {
    render(<EditorSidebarLeft {...baseProps} />);
    expect(screen.getByText(SIDEBAR_SECTIONS.POST_SETTINGS)).toBeInTheDocument();
    expect(screen.getByText(SIDEBAR_SECTIONS.TAGS)).toBeInTheDocument();
    expect(screen.getByText(SYNC_LABEL["META_DESCRIPTION_LABEL"])).toBeInTheDocument();
    expect(screen.getByPlaceholderText(SYNC_LABEL["META_DESCRIPTION_PLACEHOLDER"])).toBeInTheDocument();
  });

  it("shows tag chips when tagList is populated", () => {
    render(<EditorSidebarLeft {...baseProps} tagList={["react", "vitest"]} />);
    expect(screen.getAllByText("react").length).toBeGreaterThan(0);
    expect(screen.getAllByText("vitest").length).toBeGreaterThan(0);
  });

  it("fires improve-with-AI handler from SEO section", async () => {
    const onImproveWithAi = vi.fn();
    render(<EditorSidebarLeft {...baseProps} onImproveWithAi={onImproveWithAi} />);
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL["SEO_IMPROVE_WITH_AI"] }));
    expect(onImproveWithAi).toHaveBeenCalledOnce();
  });

  it("clears cover image from featured image section", async () => {
    const onCoverImageChange = vi.fn();
    render(
      <EditorSidebarLeft
        {...baseProps}
        formData={{ ...baseProps.formData, cover_image: "https://cdn.test/cover.png" }}
        onCoverImageChange={onCoverImageChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: EDITOR_UI["COVER_REMOVE_ARIA"] }));
    expect(onCoverImageChange).toHaveBeenCalledWith("");
  });

  it("renders mobile sheet when viewport is not desktop", () => {
    mediaQueryMock.mockReturnValue(false);
    render(<EditorSidebarLeft {...baseProps} isOpen />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("uploads cover file and updates parent url", async () => {
    const onCoverImageChange = vi.fn();
    vi.mocked(apiClient.uploadImage).mockResolvedValue({
      success: true,
      data: { url: "https://cdn.test/new-cover.png" },
    });
    render(<EditorSidebarLeft {...baseProps} onCoverImageChange={onCoverImageChange} />);
    const input = document.getElementById("editor-featured-cover-upload") as HTMLInputElement;
    const file = new File(["img"], "cover.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(onCoverImageChange).toHaveBeenCalledWith("https://cdn.test/new-cover.png");
    });
  });
});
