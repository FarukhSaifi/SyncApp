import React from "react";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AI_CONTENT_MODELS } from "@constants/ai";
import { AI_LOADING } from "@constants/editor";
import { EDITOR_UI } from "@constants/messages";
import { PLATFORMS } from "@constants/platforms";
import { POST_STATUS } from "@constants/postStatus";

vi.mock("@hooks/useMediaQuery", () => ({
  useMediaQuery: () => true,
}));

vi.mock("@components/editor/SchedulePostModal", () => ({
  default: () => null,
}));

vi.mock("@components/editor/LinkedInPostPanel", () => ({
  default: () => null,
}));

vi.mock("@utils/apiClient", () => ({
  apiClient: {
    aiKeywordResearch: vi.fn(),
    aiTrendingTopics: vi.fn(),
    aiDevtoTags: vi.fn(),
  },
}));

import EditorSidebarRight from "./EditorSidebarRight";

function noopAsync(): Promise<boolean> {
  return Promise.resolve(true);
}

describe("EditorSidebarRight generate modal", () => {
  afterEach(() => {
    cleanup();
  });

  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    postId: "post-1",
    status: POST_STATUS.DRAFT,
    publishing: false,
    loading: false,
    onSaveDraft: vi.fn(),
    onPublishToPlatform: vi.fn(),
    onPublishToAll: vi.fn(),
    onDownloadMdx: vi.fn(),
    scheduledFor: "",
    scheduledPlatforms: [] as string[],
    onScheduleSave: noopAsync,
    coverImage: "",
    aiKeyword: "react",
    setAiKeyword: vi.fn(),
    aiModel: AI_CONTENT_MODELS[0].id,
    setAiModel: vi.fn(),
    aiModels: [...AI_CONTENT_MODELS],
    targetPlatforms: [PLATFORMS.DEVTO],
    setTargetPlatforms: vi.fn(),
    researchContext: null,
    applyResearchPick: vi.fn(),
    selectSuggestionKeyword: vi.fn(),
    aiImagePrompt: "",
    setAiImagePrompt: vi.fn(),
    aiLoading: AI_LOADING.IDLE,
    generatedImageDataUrl: null,
    generatedImageUrl: null,
    generatedImageSource: null,
    uploadingCover: false,
    linkedinPost: null,
    linkedinReadMoreUrl: null,
    linkedinMissingCanonical: false,
    linkedinConnected: false,
    onCopyLinkedInPost: vi.fn(),
    onPublishLinkedInPost: vi.fn(),
    onGenerateLinkedInSummary: vi.fn(),
    onGeneratePost: vi.fn(),
    onGenerateImage: vi.fn(),
    onUseAsFeaturedImage: vi.fn(),
    onUploadAndAttach: vi.fn(),
    connectedPlatforms: [PLATFORMS.DEVTO],
  };

  it("opens generate post modal from sidebar", async () => {
    render(<EditorSidebarRight {...baseProps} />);
    await userEvent.click(
      screen.getAllByRole("button", { name: new RegExp(EDITOR_UI["GENERATE_FULL_POST"], "i") })[0],
    );
    expect(screen.getByText(EDITOR_UI["GENERATE_POST_MODAL_TITLE"])).toBeInTheDocument();
  });
});
