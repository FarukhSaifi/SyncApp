import React from "react";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_EDITOR_FORM } from "@constants/editor";
import { SYNC_LABEL } from "@constants/messages";

const editorState = {
  id: undefined,
  router: { push: vi.fn(), replace: vi.fn() },
  formData: { ...INITIAL_EDITOR_FORM, title: "Draft title", content_markdown: "Hello" },
  setFormData: vi.fn(),
  tagList: [],
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
  connectedPlatforms: [],
  persistedSeoContext: { primaryKeyword: "", platforms: [] },
  handleInputChange: vi.fn(),
  updateFormField: vi.fn(),
  handleAddTag: vi.fn(),
  handleRemoveTag: vi.fn(),
  handleTagKeyDown: vi.fn(),
  handleSave: vi.fn(),
  handlePublishToPlatform: vi.fn(),
  handlePublishToAll: vi.fn(),
  handleDownloadMdx: vi.fn(),
  handleScheduleSave: vi.fn(),
  togglePreview: vi.fn(),
};

const editorAI = {
  aiKeyword: "",
  setAiKeyword: vi.fn(),
  targetPlatforms: [],
  setTargetPlatforms: vi.fn(),
  aiModel: "gpt",
  setAiModel: vi.fn(),
  handleGenerateImage: vi.fn(),
  hydrateLinkedInPost: vi.fn(),
  researchContext: null,
  setResearchContext: vi.fn(),
  aiImagePrompt: "",
  setAiImagePrompt: vi.fn(),
  aiLoading: {},
  linkedInPost: "",
  setLinkedInPost: vi.fn(),
  seoImproveItems: [] as never[],
  setSeoImproveItems: vi.fn(),
  seoImproveModalOpen: false,
  setSeoImproveModalOpen: vi.fn(),
  handleGeneratePost: vi.fn(),
  handleKeywordResearch: vi.fn(),
  handleImproveSeo: vi.fn(),
  handleApplySeoImprove: vi.fn(),
  handleGenerateLinkedInSummary: vi.fn(),
  handleEditSelection: vi.fn(),
};

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
  useToast: () => ({ apiError: vi.fn(), success: vi.fn() }),
}));

vi.mock("@hooks/useWordCount", () => ({
  useWordCount: () => ({ words: 1, characters: 5, readingTimeMinutes: 1 }),
}));

vi.mock("@hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    const DynamicEditorContent = () => <div data-testid="editor-content-stub">content</div>;
    return DynamicEditorContent;
  },
}));

vi.mock("@components/editor/EditorSidebarLeft", () => ({
  default: () => <div data-testid="sidebar-left" />,
}));

vi.mock("@components/editor/EditorSidebarRight", () => ({
  default: () => <div data-testid="sidebar-right" />,
}));

vi.mock("@components/editor/SeoImproveReviewModal", () => ({
  default: () => null,
}));

import Editor from "./Editor";

describe("Editor view", () => {
  beforeEach(() => {
    editorState.activeTab = "edit";
    editorState.togglePreview.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("switches to preview tab", () => {
    editorState.activeTab = "edit";
    editorState.togglePreview.mockClear();
    render(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    const previewBtn = screen.getByText(SYNC_LABEL["TAB_PREVIEW"]);
    previewBtn.click();
    expect(editorState.togglePreview).toHaveBeenCalled();
  });

  it("renders toolbar and sidebars", () => {
    render(<Editor onPostCreate={vi.fn()} onPostUpdate={vi.fn()} />);
    expect(screen.getAllByTestId("sidebar-left").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("sidebar-right").length).toBeGreaterThan(0);
    expect(screen.getByTestId("editor-content-stub")).toBeInTheDocument();
    expect(screen.getByText(SYNC_LABEL.NEW_POST)).toBeInTheDocument();
  });
});
