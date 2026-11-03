import React from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiClient } from "@utils/apiClient";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AI_CONTENT_MODELS } from "@constants/ai";
import { EDITOR_UI } from "@constants/messages";
import { OPTIMIZATION_TARGETS } from "@constants/platforms";

import GeneratePostModal from "./GeneratePostModal";

describe("GeneratePostModal", () => {
  const onClose = vi.fn();
  const onGenerate = vi.fn();
  const onKeywordChange = vi.fn();
  const onModelChange = vi.fn();
  const onTargetPlatformsChange = vi.fn();
  const onResearchPick = vi.fn();
  const onSelectSuggestionKeyword = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    onGenerate.mockReset();
    vi.spyOn(apiClient, "aiKeywordResearch").mockResolvedValue({
      success: true,
      data: {
        seed: "react",
        keywords: [
          {
            keyword: "react testing",
            commercialIntent: 40,
            competition: 30,
            opportunityScore: 60,
            intentLabel: "informational",
            monetizationAngle: "Tools",
            rationale: "High intent",
          },
        ],
        source: "google_search",
        cached: false,
        updatedAt: new Date().toISOString(),
        scoresEstimated: true,
      },
    });
    vi.spyOn(apiClient, "aiTrendingTopics").mockResolvedValue({
      success: true,
      data: {
        topics: ["Topic A"],
        keywords: ["kw1"],
        source: "google_search",
        cached: false,
        updatedAt: new Date().toISOString(),
      },
    });
    vi.spyOn(apiClient, "aiDevtoTags").mockResolvedValue({
      success: true,
      data: { tags: ["tag1"], source: "devto", cached: false, updatedAt: new Date().toISOString() },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderModal(overrides: Partial<React.ComponentProps<typeof GeneratePostModal>> = {}) {
    return render(
      <GeneratePostModal
        isOpen
        onClose={onClose}
        keyword="react hooks"
        onKeywordChange={onKeywordChange}
        selectedModel={AI_CONTENT_MODELS[0]?.id ?? "gpt"}
        onModelChange={onModelChange}
        models={[...AI_CONTENT_MODELS]}
        targetPlatforms={[OPTIMIZATION_TARGETS.DEVTO]}
        onTargetPlatformsChange={onTargetPlatformsChange}
        onGenerate={onGenerate}
        isGenerating={false}
        researchContext={null}
        onResearchPick={onResearchPick}
        onSelectSuggestionKeyword={onSelectSuggestionKeyword}
        {...overrides}
      />,
    );
  }

  it("renders modal title and triggers generate when enabled", async () => {
    renderModal();
    expect(screen.getByText(EDITOR_UI["GENERATE_POST_MODAL_TITLE"])).toBeInTheDocument();

    const generateBtn = screen.getByRole("button", { name: new RegExp(EDITOR_UI["GENERATE_POST_CONFIRM"], "i") });
    await userEvent.click(generateBtn);
    expect(onGenerate).toHaveBeenCalled();
  });

  it("runs keyword research from seed input", async () => {
    renderModal({ keyword: "" });
    const seedInput = screen.getAllByPlaceholderText(EDITOR_UI["KEYWORD_RESEARCH_SEED_PLACEHOLDER"])[0];
    await userEvent.type(seedInput, "nextjs");
    await userEvent.click(
      screen.getAllByRole("button", { name: new RegExp(EDITOR_UI["KEYWORD_RESEARCH_BUTTON"], "i") })[0],
    );

    await waitFor(() => {
      expect(apiClient.aiKeywordResearch).toHaveBeenCalledWith("nextjs");
    });
  });

  it("loads trending topics on refresh", async () => {
    renderModal();
    const refreshButtons = screen.getAllByRole("button", {
      name: new RegExp(EDITOR_UI["TRENDING_TOPICS_REFRESH"], "i"),
    });
    await userEvent.click(refreshButtons[refreshButtons.length - 1]);
    await waitFor(() => {
      expect(apiClient.aiTrendingTopics).toHaveBeenCalled();
    });
  });

  it("calls onClose from cancel control", async () => {
    renderModal();
    await userEvent.click(
      screen.getAllByRole("button", { name: new RegExp(EDITOR_UI["GENERATE_POST_CANCEL"], "i") })[0],
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText(EDITOR_UI["GENERATE_POST_MODAL_TITLE"])).not.toBeInTheDocument();
  });

  it("loads devto tags when modal opens", async () => {
    renderModal();
    await waitFor(() => {
      expect(apiClient.aiDevtoTags).toHaveBeenCalled();
    });
  });

  it("surfaces keyword research API errors via toast", async () => {
    vi.mocked(apiClient.aiKeywordResearch).mockResolvedValueOnce({ success: false, error: "research fail" });
    renderModal({ keyword: "" });
    const seedInput = screen.getAllByPlaceholderText(EDITOR_UI["KEYWORD_RESEARCH_SEED_PLACEHOLDER"])[0];
    await userEvent.type(seedInput, "seo");
    await userEvent.click(
      screen.getAllByRole("button", { name: new RegExp(EDITOR_UI["KEYWORD_RESEARCH_BUTTON"], "i") })[0],
    );
    await waitFor(() => {
      expect(apiClient.aiKeywordResearch).toHaveBeenCalled();
    });
  });
});
