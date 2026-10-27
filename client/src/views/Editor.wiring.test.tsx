import React from "react";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const editorState = vi.hoisted(() => ({
  id: "post-1",
  router: { push: vi.fn(), replace: vi.fn() },
  formData: {
    title: "Short",
    content_markdown: "# Hello\n\nBody content here.",
    meta_description: "",
    status: "draft",
    cover_image: "",
    canonical_url: "",
    scheduled_for: "",
    scheduled_platforms: [] as string[],
    linkedin_post: "",
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
  isDirty: false,
  lastSavedAt: null,
  connectedPlatforms: ["devto"],
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
  aiKeyword: "react",
  setAiKeyword: vi.fn(),
  targetPlatforms: ["devto"],
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
  improveReviewOpen: true,
  improveReviewItems: [] as Array<{
    id: string;
    field: string;
    applyMode: string;
    issue: string;
    currentValue: string;
    value: string;
    selected: boolean;
  }>,
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

vi.mock("@hooks/useEditorState", () => ({
  useEditorState: () => editorState,
}));

vi.mock("@hooks/useEditorAI", () => ({
  useEditorAI: () => editorAI,
}));

vi.mock("@hooks/useUnsavedLeaveGuard", () => ({
  useUnsavedLeaveGuard: () => ({
    isLeaveModalOpen: false,
    confirmLeave: vi.fn(),
    cancelLeave: vi.fn(),
    requestLeave: vi.fn(),
  }),
}));

vi.mock("@hooks/useToast", () => ({
  useToast: () => ({ apiError: vi.fn(), success: vi.fn(), validationError: vi.fn() }),
}));

vi.mock("@hooks/useWordCount", () => ({
  useWordCount: () => ({ words: 10, characters: 50, readingTimeMinutes: 1 }),
}));

vi.mock("@hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

import Editor from "./Editor";

const reviewItems = [
  {
    id: "title-fix",
    field: "title",
    applyMode: "replace",
    issue: "Short title",
    currentValue: "Hi",
    value: "Better title",
    selected: true,
  },
];

describe("Editor wiring", () => {
  beforeEach(() => {
    editorAI.improveReviewOpen = true;
    editorAI.improveReviewItems = [...reviewItems];
    editorAI.handleApplyImproveFixes.mockImplementation((apply: (fixes: unknown[]) => void) => {
      apply(reviewItems);
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders real sidebars and SEO improve review modal", () => {
    render(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    expect(screen.getAllByText(SYNC_LABEL["SEO_IMPROVE_WITH_AI"]).length).toBeGreaterThan(0);
    expect(screen.getByText(SYNC_LABEL["SEO_IMPROVE_REVIEW_TITLE"])).toBeInTheDocument();
  });

  it("toggles left sidebar from toolbar control", async () => {
    render(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: EDITOR_UI["TOGGLE_POST_SETTINGS"] }));
    expect(screen.getAllByText(SYNC_LABEL["SEO_IMPROVE_WITH_AI"]).length).toBeGreaterThan(0);
  });

  it("starts improve-with-AI flow from sidebar", async () => {
    editorAI.improveReviewOpen = false;
    editorAI.handleImproveWithAi.mockClear();
    render(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    const improveBtn = screen.getAllByRole("button", { name: new RegExp(SYNC_LABEL["SEO_IMPROVE_WITH_AI"], "i") })[0];
    await userEvent.click(improveBtn);
    expect(editorAI.handleImproveWithAi).toHaveBeenCalled();
  });

  it("applies SEO fixes from review modal", async () => {
    render(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    const applyBtn = screen.getByRole("button", { name: new RegExp(SYNC_LABEL["SEO_IMPROVE_APPLY_SELECTED"], "i") });
    await userEvent.click(applyBtn);
    expect(editorAI.handleApplyImproveFixes).toHaveBeenCalled();
    expect(editorState.setFormData).toHaveBeenCalled();
  });
});
