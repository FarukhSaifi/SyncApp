import { act, renderHook, waitFor } from "@testing-library/react";
import { apiClient } from "@utils/apiClient";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SYNC_LABEL, TOAST_TITLES } from "@constants/messages";
import { OPTIMIZATION_TARGETS } from "@constants/platforms";
import { SEO_IMPROVE_APPLY, SEO_IMPROVE_FIELDS } from "@constants/seo";

const toast = {
  validationError: vi.fn(),
  apiError: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
};

vi.mock("@hooks/useToast", () => ({
  useToast: () => toast,
}));

import { useEditorAI } from "./useEditorAI";

function baseOptions() {
  return {
    postId: undefined as string | undefined,
    getArticleContext: () => ({ title: "Title", content: "Body text" }),
    onDraftGenerated: vi.fn(),
    onLinkedInSummaryGenerated: vi.fn(),
    onCoverImageSet: vi.fn(),
  };
}

describe("useEditorAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires keyword and targets before generating a post", async () => {
    const { result } = renderHook(() => useEditorAI(baseOptions()));

    await act(async () => {
      await result.current.handleGeneratePost();
    });
    expect(toast.validationError).toHaveBeenCalledWith(SYNC_LABEL["AI_KEYWORD_REQUIRED"]);

    act(() => {
      result.current.setAiKeyword("react hooks");
      result.current.setTargetPlatforms([]);
    });

    await act(async () => {
      await result.current.handleGeneratePost();
    });
    expect(toast.validationError).toHaveBeenCalledWith(SYNC_LABEL["AI_TARGETS_REQUIRED"]);
  });

  it("generates post and calls onDraftGenerated on success", async () => {
    const onDraftGenerated = vi.fn();
    vi.spyOn(apiClient, "aiGenerate").mockResolvedValue({
      success: true,
      data: { title: "T", meta_description: "Meta", content: "Generated body", tags: ["js"] },
    });

    const { result } = renderHook(() =>
      useEditorAI({ ...baseOptions(), onDraftGenerated }),
    );

    act(() => {
      result.current.setAiKeyword("react");
      result.current.setTargetPlatforms([OPTIMIZATION_TARGETS.DEVTO]);
    });

    await act(async () => {
      await result.current.handleGeneratePost();
    });

    await waitFor(() => {
      expect(apiClient.aiGenerate).toHaveBeenCalled();
      expect(onDraftGenerated).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("parses JSON embedded in content from AI response", async () => {
    const onDraftGenerated = vi.fn();
    vi.spyOn(apiClient, "aiGenerate").mockResolvedValue({
      success: true,
      data: {
        title: "",
        meta_description: "",
        tags: [],
        content: '```json\n{"title":"Parsed","content_markdown":"# Hi","tags":["a"]}\n```',
      },
    });

    const { result } = renderHook(() =>
      useEditorAI({ ...baseOptions(), onDraftGenerated }),
    );

    act(() => {
      result.current.setAiKeyword("topic");
      result.current.setTargetPlatforms([OPTIMIZATION_TARGETS.DEVTO]);
    });

    await act(async () => {
      await result.current.handleGeneratePost();
    });

    expect(onDraftGenerated).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Parsed", content: "# Hi" }),
    );
  });

  it("validates article context before LinkedIn summary", async () => {
    const { result } = renderHook(() =>
      useEditorAI({
        ...baseOptions(),
        getArticleContext: () => ({ title: "", content: "" }),
      }),
    );

    await act(async () => {
      await result.current.handleGenerateLinkedInSummary();
    });

    expect(toast.validationError).toHaveBeenCalledWith(SYNC_LABEL["AI_LINKEDIN_SUMMARY_CONTEXT_REQUIRED"]);
  });

  it("generates LinkedIn summary on success", async () => {
    const onLinkedInSummaryGenerated = vi.fn();
    vi.spyOn(apiClient, "aiGenerateLinkedInSummary").mockResolvedValue({
      success: true,
      data: { linkedin_post: "Summary line", linkedin_missing_canonical: false },
    });

    const { result } = renderHook(() =>
      useEditorAI({ ...baseOptions(), onLinkedInSummaryGenerated }),
    );

    await act(async () => {
      await result.current.handleGenerateLinkedInSummary();
    });

    expect(onLinkedInSummaryGenerated).toHaveBeenCalled();
    expect(result.current.linkedinPost).toContain("Summary");
  });

  it("clears research context when keyword diverges from research pick", () => {
    const { result } = renderHook(() => useEditorAI(baseOptions()));

    act(() => {
      result.current.applyResearchPick({
        keyword: "React SEO",
        monetizationAngle: "Affiliate",
        intentLabel: "informational",
        commercialIntent: 50,
        competition: 30,
        opportunityScore: 70,
        rationale: "Strong fit",
      });
    });

    expect(result.current.researchContext).not.toBeNull();

    act(() => {
      result.current.setAiKeyword("Different keyword");
    });

    expect(result.current.researchContext).toBeNull();
  });

  it("requires keyword before generating an image", async () => {
    const { result } = renderHook(() => useEditorAI(baseOptions()));

    await act(async () => {
      await result.current.handleGenerateImage();
    });

    expect(toast.validationError).toHaveBeenCalledWith(SYNC_LABEL["AI_KEYWORD_REQUIRED_FOR_IMAGE"]);
  });

  it("generates image on success", async () => {
    vi.spyOn(apiClient, "aiGenerateImage").mockResolvedValue({
      success: true,
      data: { imageDataUrl: "data:image/png;base64,abc", imageUrl: "https://cdn.test/x.png", source: "gemini" },
    });

    const { result } = renderHook(() => useEditorAI(baseOptions()));

    act(() => {
      result.current.setAiKeyword("cover topic");
    });

    await act(async () => {
      await result.current.handleGenerateImage();
    });

    expect(result.current.generatedImageDataUrl).toContain("base64");
    expect(toast.success).toHaveBeenCalledWith(TOAST_TITLES["IMAGE_GENERATED"], SYNC_LABEL["AI_IMAGE_GENERATED"]);
  });

  it("surfaces image generation API errors", async () => {
    vi.spyOn(apiClient, "aiGenerateImage").mockResolvedValue({ success: false, error: "quota" });

    const { result } = renderHook(() => useEditorAI(baseOptions()));

    act(() => {
      result.current.setAiKeyword("topic");
    });

    await act(async () => {
      await result.current.handleGenerateImage();
    });

    expect(toast.apiError).toHaveBeenCalled();
  });

  it("uses generated image as featured cover", async () => {
    vi.spyOn(apiClient, "aiGenerateImage").mockResolvedValue({
      success: true,
      data: { imageDataUrl: "data:image/png;base64,abc" },
    });
    const onCoverImageSet = vi.fn();
    const { result } = renderHook(() => useEditorAI({ ...baseOptions(), onCoverImageSet }));

    act(() => {
      result.current.setAiKeyword("x");
    });

    await act(async () => {
      await result.current.handleGenerateImage();
    });

    act(() => {
      result.current.handleUseAsFeaturedImage();
    });

    expect(onCoverImageSet).toHaveBeenCalledWith("data:image/png;base64,abc");
  });

  it("uploads and attaches cover when postId is set", async () => {
    vi.spyOn(apiClient, "aiGenerateImage").mockResolvedValue({
      success: true,
      data: { imageDataUrl: "data:image/png;base64,abc" },
    });
    vi.spyOn(apiClient, "uploadPostCover").mockResolvedValue({
      success: true,
      data: { url: "https://cdn.test/cover.png", post: { _id: "post-1" } },
    });

    const onCoverImageSet = vi.fn();
    const { result } = renderHook(() =>
      useEditorAI({ ...baseOptions(), postId: "post-1", onCoverImageSet }),
    );

    act(() => {
      result.current.setAiKeyword("topic");
    });

    await act(async () => {
      await result.current.handleGenerateImage();
    });

    await act(async () => {
      await result.current.handleUploadAndAttach();
    });

    expect(apiClient.uploadPostCover).toHaveBeenCalled();
    expect(onCoverImageSet).toHaveBeenCalledWith("https://cdn.test/cover.png");
  });

  it("copies linkedin post to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const { result } = renderHook(() => useEditorAI(baseOptions()));

    act(() => {
      result.current.hydrateLinkedInPost("Post body", false);
    });

    await act(async () => {
      await result.current.handleCopyLinkedInPost();
    });

    expect(writeText).toHaveBeenCalledWith("Post body");
    vi.unstubAllGlobals();
  });

  it("downloads generated image via temporary anchor", async () => {
    vi.spyOn(apiClient, "aiGenerateImage").mockResolvedValue({
      success: true,
      data: { imageDataUrl: "data:image/png;base64,abc" },
    });
    const anchor = document.createElement("a");
    const clickSpy = vi.spyOn(anchor, "click").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue(anchor);

    const { result } = renderHook(() => useEditorAI(baseOptions()));

    act(() => {
      result.current.setAiKeyword("t");
    });

    await act(async () => {
      await result.current.handleGenerateImage();
    });

    act(() => {
      result.current.handleDownloadImage();
    });

    expect(clickSpy).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(TOAST_TITLES["DOWNLOADED"], SYNC_LABEL["AI_IMAGE_DOWNLOADED"]);
  });

  it("validates empty SEO improve targets", async () => {
    const { result } = renderHook(() => useEditorAI(baseOptions()));

    await act(async () => {
      await result.current.handleImproveWithAi([]);
    });

    expect(toast.validationError).toHaveBeenCalledWith(SYNC_LABEL["AI_SEO_IMPROVE_NONE"]);
  });

  it("handles improve SEO API failures", async () => {
    vi.spyOn(apiClient, "aiImproveSeo").mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useEditorAI(baseOptions()));

    await act(async () => {
      await result.current.handleImproveWithAi([
        {
          id: "title-fix",
          field: SEO_IMPROVE_FIELDS.TITLE,
          issue: "Title short",
          currentValue: "Hi",
          applyMode: SEO_IMPROVE_APPLY.REPLACE,
        },
      ]);
    });

    expect(toast.apiError).toHaveBeenCalled();
  });

  it("opens improve review modal when fixes return", async () => {
    const targets = [
      {
        id: "title-fix",
        field: SEO_IMPROVE_FIELDS.TITLE,
        issue: "Title short",
        currentValue: "Hi",
        applyMode: SEO_IMPROVE_APPLY.REPLACE,
      },
    ];

    vi.spyOn(apiClient, "aiImproveSeo").mockResolvedValue({
      success: true,
      data: {
        fixes: [{ id: "title-fix", value: "Better title", note: "Expanded" }],
      },
    });

    const { result } = renderHook(() => useEditorAI(baseOptions()));

    await act(async () => {
      await result.current.handleImproveWithAi(targets);
    });

    expect(result.current.improveReviewOpen).toBe(true);
    expect(result.current.improveReviewItems).toHaveLength(1);
  });

  it("requires selection before applying improve fixes", () => {
    const apply = vi.fn();
    const { result } = renderHook(() => useEditorAI(baseOptions()));

    act(() => {
      result.current.handleApplyImproveFixes(apply);
    });

    expect(toast.validationError).toHaveBeenCalledWith(SYNC_LABEL["AI_SEO_IMPROVE_NO_SELECTION"]);
    expect(apply).not.toHaveBeenCalled();
  });

  it("applies selected improve fixes via callback", async () => {
    vi.spyOn(apiClient, "aiImproveSeo").mockResolvedValue({
      success: true,
      data: { fixes: [{ id: "title-fix", value: "Better title" }] },
    });

    const apply = vi.fn();
    const { result } = renderHook(() => useEditorAI(baseOptions()));

    await act(async () => {
      await result.current.handleImproveWithAi([
        {
          id: "title-fix",
          field: SEO_IMPROVE_FIELDS.TITLE,
          issue: "Title short",
          currentValue: "Hi",
          applyMode: SEO_IMPROVE_APPLY.REPLACE,
        },
      ]);
    });

    act(() => {
      result.current.handleApplyImproveFixes(apply);
    });

    expect(apply).toHaveBeenCalled();
    expect(result.current.improveReviewOpen).toBe(false);
  });

  it("toggles improve review item selection", async () => {
    vi.spyOn(apiClient, "aiImproveSeo").mockResolvedValue({
      success: true,
      data: { fixes: [{ id: "title-fix", value: "Better title" }] },
    });

    const { result } = renderHook(() => useEditorAI(baseOptions()));

    await act(async () => {
      await result.current.handleImproveWithAi([
        {
          id: "title-fix",
          field: SEO_IMPROVE_FIELDS.TITLE,
          issue: "Title short",
          currentValue: "Hi",
          applyMode: SEO_IMPROVE_APPLY.REPLACE,
        },
      ]);
    });

    const itemId = result.current.improveReviewItems[0]?.id;
    expect(itemId).toBeDefined();

    act(() => {
      result.current.toggleImproveReviewItem(itemId!);
    });

    expect(result.current.improveReviewItems[0]?.selected).toBe(false);
  });

  it("copies image URL to clipboard", async () => {
    vi.spyOn(apiClient, "aiGenerateImage").mockResolvedValue({
      success: true,
      data: { imageDataUrl: "data:image/png;base64,abc", imageUrl: "https://cdn.test/img.png" },
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const { result } = renderHook(() => useEditorAI(baseOptions()));

    act(() => {
      result.current.setAiKeyword("topic");
    });
    await act(async () => {
      await result.current.handleGenerateImage();
    });
    await act(async () => {
      await result.current.handleCopyImageUrl();
    });

    expect(writeText).toHaveBeenCalledWith("https://cdn.test/img.png");
    vi.unstubAllGlobals();
  });

  it("closes improve review modal", () => {
    const { result } = renderHook(() => useEditorAI(baseOptions()));

    act(() => {
      result.current.closeImproveReview();
    });

    expect(result.current.improveReviewOpen).toBe(false);
  });

  it("hydrates and clears LinkedIn post text", () => {
    const { result } = renderHook(() => useEditorAI(baseOptions()));

    act(() => {
      result.current.hydrateLinkedInPost("Hello LI", true);
    });
    expect(result.current.linkedinPost).toBe("Hello LI");
    expect(result.current.linkedinMissingCanonical).toBe(true);

    act(() => {
      result.current.clearLinkedInPost();
    });
    expect(result.current.linkedinPost).toBeNull();
  });
});
