import React from "react";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AI_CONTENT_MODELS } from "@constants/ai";
import { AI_LOADING } from "@constants/editor";
import { PUBLISH_SECTIONS } from "@constants/editor";
import { EDITOR_UI, SYNC_LABEL } from "@constants/messages";
import { PLATFORMS } from "@constants/platforms";
import { POST_STATUS } from "@constants/postStatus";

vi.mock("@hooks/useMediaQuery", () => ({
  useMediaQuery: () => true,
}));

vi.mock("@components/editor/GeneratePostModal", () => ({
  default: () => null,
}));

vi.mock("@components/editor/SchedulePostModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="schedule-modal">schedule</div> : null),
}));

vi.mock("@components/editor/LinkedInPostPanel", () => ({
  default: () => null,
}));

import EditorSidebarRight from "./EditorSidebarRight";

function noopAsync(): Promise<boolean> {
  return Promise.resolve(true);
}

describe("EditorSidebarRight", () => {
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
    aiKeyword: "",
    setAiKeyword: vi.fn(),
    aiModel: AI_CONTENT_MODELS[0].id,
    setAiModel: vi.fn(),
    aiModels: [...AI_CONTENT_MODELS],
    targetPlatforms: [] as string[],
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

  it("renders publish and AI actions on desktop", () => {
    render(<EditorSidebarRight {...baseProps} />);
    expect(screen.getByText(SYNC_LABEL["SAVE_DRAFT"])).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(EDITOR_UI["GENERATE_FULL_POST"], "i") })).toBeInTheDocument();
  });

  it("starts generate-post flow from AI section", async () => {
    const onClose = vi.fn();
    render(<EditorSidebarRight {...baseProps} onClose={onClose} />);
    await userEvent.click(
      screen.getAllByRole("button", { name: new RegExp(EDITOR_UI["GENERATE_FULL_POST"], "i") })[0],
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("publishes to a connected platform from dropdown", async () => {
    const onPublishToPlatform = vi.fn();
    render(<EditorSidebarRight {...baseProps} onPublishToPlatform={onPublishToPlatform} />);
    const publishTrigger = screen
      .getAllByRole("button")
      .find((button) => button.getAttribute("aria-haspopup") === "menu");
    expect(publishTrigger).toBeDefined();
    await userEvent.click(publishTrigger as HTMLButtonElement);
    await userEvent.click(screen.getByRole("menuitem", { name: SYNC_LABEL["PUBLISH_TO_DEVTO"] }));
    expect(onPublishToPlatform).toHaveBeenCalledWith(PLATFORMS.DEVTO);
  });

  it("saves draft and exports mdx from sidebar actions", async () => {
    const onSaveDraft = vi.fn();
    const onDownloadMdx = vi.fn();
    render(<EditorSidebarRight {...baseProps} onSaveDraft={onSaveDraft} onDownloadMdx={onDownloadMdx} />);
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL["SAVE_DRAFT"] }));
    expect(onSaveDraft).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: new RegExp(PUBLISH_SECTIONS["EXPORT"], "i") }));
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL["EXPORT_MDX"] }));
    expect(onDownloadMdx).toHaveBeenCalledOnce();
  });

  it("shows connect-platform hint when none connected", () => {
    render(<EditorSidebarRight {...baseProps} connectedPlatforms={[]} />);
    expect(screen.getByText(SYNC_LABEL["CONNECT_PLATFORM_TO_PUBLISH"])).toBeInTheDocument();
  });

  it("opens schedule modal from publish section", async () => {
    render(<EditorSidebarRight {...baseProps} />);
    await userEvent.click(screen.getByRole("button", { name: new RegExp(EDITOR_UI["SCHEDULE_MODAL_BUTTON"], "i") }));
    expect(screen.getByTestId("schedule-modal")).toBeInTheDocument();
  });

  it("opens AI image modal when generation produces data url", () => {
    render(
      <EditorSidebarRight
        {...baseProps}
        aiLoading={AI_LOADING["IMAGE"]}
        generatedImageDataUrl="data:image/png;base64,abc"
      />,
    );
    expect(screen.getByText(EDITOR_UI["AI_IMAGE_MODAL_TITLE"])).toBeInTheDocument();
  });
});
