import React from "react";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as seoImproveTargets from "@utils/seoImproveTargets";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EDITOR_UI, SYNC_LABEL } from "@constants/messages";

vi.mock("@hooks/useMediaQuery", () => ({
  useMediaQuery: () => true,
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    const Stub = () => <div data-testid="editor-content-stub">content</div>;
    return Stub;
  },
}));

const leaveGuard = vi.hoisted(() => ({
  isLeaveModalOpen: false,
  confirmLeave: vi.fn(),
  cancelLeave: vi.fn(),
  closeLeaveModal: vi.fn(),
  requestLeave: vi.fn((fn: () => void) => {
    fn();
  }),
}));

const editorState = vi.hoisted(() => ({
  id: "post-1",
  router: { push: vi.fn(), replace: vi.fn() },
  formData: {
    title: "Title",
    content_markdown: "# Hello\n\nBody",
    meta_description: "Meta",
    status: "draft",
    cover_image: "",
    canonical_url: "https://blog.example.com/my-slug",
    scheduled_for: "",
    scheduled_platforms: [] as string[],
    linkedin_post: "Teaser line",
    linkedin_read_more_url: "",
  },
  setFormData: vi.fn(),
  tagList: ["js"],
  setTagList: vi.fn(),
  tagInput: "",
  setTagInput: vi.fn(),
  loading: false,
  initialLoading: false,
  publishing: false,
  activeTab: "edit" as const,
  setActiveTab: vi.fn(),
  isDirty: true,
  lastSavedAt: null,
  connectedPlatforms: ["linkedin"],
  persistedSeoContext: { primaryKeyword: "react", platforms: ["devto"] },
  handleInputChange: vi.fn(),
  updateFormField: vi.fn(),
  handleAddTag: vi.fn(),
  handleRemoveTag: vi.fn(),
  handleTagKeyDown: vi.fn(),
  handleSave: vi.fn(),
  handlePublishToPlatform: vi.fn(),
  handlePublishToAll: vi.fn(),
  handleDownloadMdx: vi.fn(),
  handleScheduleSave: vi.fn().mockResolvedValue(true),
  togglePreview: vi.fn(),
}));

const editorAI = vi.hoisted(() => ({
  aiKeyword: "",
  setAiKeyword: vi.fn(),
  targetPlatforms: [] as string[],
  setTargetPlatforms: vi.fn(),
  aiModel: "gemini-3.5-flash-lite",
  setAiModel: vi.fn(),
  aiModels: [{ id: "gemini-3.5-flash-lite", label: "Lite", description: "" }],
  researchContext: null,
  applyResearchPick: vi.fn(),
  clearResearchContext: vi.fn(),
  selectSuggestionKeyword: vi.fn(),
  aiImagePrompt: "",
  setAiImagePrompt: vi.fn(),
  aiLoading: "",
  generatedImageDataUrl: null,
  generatedImageUrl: null,
  generatedImageSource: null,
  uploadingCover: false,
  linkedinPost: null,
  linkedinReadMoreUrl: null,
  linkedinMissingCanonical: false,
  improveReviewOpen: false,
  improveReviewItems: [] as never[],
  closeImproveReview: vi.fn(),
  toggleImproveReviewItem: vi.fn(),
  handleImproveWithAi: vi.fn(),
  handleApplyImproveFixes: vi.fn(),
  handleGeneratePost: vi.fn(),
  handleGenerateLinkedInSummary: vi.fn(),
  handleGenerateImage: vi.fn(),
  handleUseAsFeaturedImage: vi.fn(),
  handleUploadAndAttach: vi.fn(),
  handleCopyLinkedInPost: vi.fn(),
  handleCopyImageUrl: vi.fn(),
  handleDownloadImage: vi.fn(),
  hydrateLinkedInPost: vi.fn(),
  clearLinkedInPost: vi.fn(),
}));

const validationError = vi.fn();

vi.mock("@hooks/useEditorState", () => ({
  useEditorState: () => editorState,
}));

vi.mock("@hooks/useEditorAI", () => ({
  useEditorAI: () => editorAI,
}));

vi.mock("@hooks/useUnsavedLeaveGuard", () => ({
  useUnsavedLeaveGuard: () => leaveGuard,
}));

vi.mock("@hooks/useToast", () => ({
  useToast: () => ({ apiError: vi.fn(), success: vi.fn(), validationError }),
}));

vi.mock("@hooks/useWordCount", () => ({
  useWordCount: () => ({ words: 10, characters: 50, readingTimeMinutes: 2 }),
}));

vi.mock("@hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

import Editor from "./Editor";

describe("Editor flows", () => {
  beforeEach(() => {
    editorState.initialLoading = false;
    editorState.activeTab = "edit";
    leaveGuard.isLeaveModalOpen = false;
    validationError.mockReset();
    editorAI.improveReviewOpen = false;
    editorState.setFormData.mockClear();
    editorAI.hydrateLinkedInPost.mockClear();
    editorAI.setAiKeyword.mockClear();
    editorAI.setTargetPlatforms.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows content skeleton while initial post load is in progress", () => {
    editorState.initialLoading = true;
    render(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    expect(screen.getByLabelText(EDITOR_UI.LOADING_EDITOR_ARIA)).toBeInTheDocument();
    expect(screen.queryByTestId("editor-content-stub")).not.toBeInTheDocument();
  });

  it("hydrates LinkedIn teaser after load completes", async () => {
    editorState.initialLoading = true;
    const { rerender } = render(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    editorState.initialLoading = false;
    rerender(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    await waitFor(() => {
      expect(editorAI.hydrateLinkedInPost).toHaveBeenCalledWith("Teaser line", false);
    });
  });

  it("restores persisted SEO keyword and platforms after load", async () => {
    editorState.initialLoading = true;
    const { rerender } = render(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    editorState.initialLoading = false;
    rerender(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    await waitFor(() => {
      expect(editorAI.setAiKeyword).toHaveBeenCalledWith("react");
      expect(editorAI.setTargetPlatforms).toHaveBeenCalledWith(["devto"]);
    });
  });

  it("shows validation when improve-with-AI has no targets", async () => {
    vi.spyOn(seoImproveTargets, "buildSeoImproveTargets").mockReturnValue([]);
    render(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    await userEvent.click(screen.getAllByRole("button", { name: SYNC_LABEL["SEO_IMPROVE_WITH_AI"] })[0]);
    expect(validationError).toHaveBeenCalledWith(SYNC_LABEL["AI_SEO_IMPROVE_NONE"]);
    expect(editorAI.handleImproveWithAi).not.toHaveBeenCalled();
  });

  it("renders unsaved leave confirmation when guard is open", () => {
    leaveGuard.isLeaveModalOpen = true;
    render(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    expect(screen.getByText(EDITOR_UI.UNSAVED_LEAVE_TITLE)).toBeInTheDocument();
  });

  it("toggles right sidebar from toolbar", async () => {
    render(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: EDITOR_UI["TOGGLE_PUBLISH_AI"] }));
    expect(screen.getAllByText(SYNC_LABEL["SAVE_DRAFT"]).length).toBeGreaterThan(0);
  });
});
