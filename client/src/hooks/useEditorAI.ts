/**
 * useEditorAI — AI assistant state and handlers for the editor.
 * Extracted from the monolithic Editor.tsx to keep concerns separated.
 */
import { useState, useCallback } from "react";

import { useToast } from "@hooks/useToast";

import { apiClient } from "@utils/apiClient";

interface UseEditorAIOptions {
  postId?: string;
  onDraftGenerated: (draft: string) => void;
  onCoverImageSet: (url: string) => void;
}

interface UseEditorAIReturn {
  aiKeyword: string;
  setAiKeyword: (v: string) => void;
  aiOutline: string;
  setAiOutline: (v: string) => void;
  aiLoading: string;
  generatedImageDataUrl: string | null;
  uploadingCover: boolean;
  handleGenerateOutline: () => Promise<void>;
  handleGenerateDraft: () => Promise<void>;
  handleGenerateImage: () => Promise<void>;
  handleUseAsFeaturedImage: () => void;
  handleUploadAndAttach: () => Promise<void>;
}

export function useEditorAI({ postId, onDraftGenerated, onCoverImageSet }: UseEditorAIOptions): UseEditorAIReturn {
  const toast = useToast();
  const [aiKeyword, setAiKeyword] = useState("");
  const [aiOutline, setAiOutline] = useState("");
  const [aiLoading, setAiLoading] = useState("");
  const [generatedImageDataUrl, setGeneratedImageDataUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleGenerateOutline = useCallback(async () => {
    const keyword = aiKeyword.trim();
    if (!keyword) {
      toast.validationError("Enter a keyword or topic");
      return;
    }
    setAiLoading("outline");
    try {
      const response = await apiClient.aiOutline(keyword);
      if (response?.success && response.data?.outline) {
        setAiOutline(response.data.outline);
        toast.success("Outline generated", "You can now generate a draft from it.");
      } else {
        toast.apiError(response?.error || "Failed to generate outline");
      }
    } catch (error) {
      toast.apiError((error as Error).message || "Failed to generate outline");
    } finally {
      setAiLoading("");
    }
  }, [aiKeyword, toast]);

  const handleGenerateDraft = useCallback(async () => {
    const outline = aiOutline.trim();
    if (!outline) {
      toast.validationError("Generate an outline first, or paste one above.");
      return;
    }
    setAiLoading("draft");
    try {
      const response = await apiClient.aiDraft(outline);
      if (response?.success && response.data?.draft) {
        onDraftGenerated(response.data.draft);
        toast.success("Draft generated", "Content added to the editor.");
      } else {
        toast.apiError(response?.error || "Failed to generate draft");
      }
    } catch (error) {
      toast.apiError((error as Error).message || "Failed to generate draft");
    } finally {
      setAiLoading("");
    }
  }, [aiOutline, onDraftGenerated, toast]);

  const handleGenerateImage = useCallback(async () => {
    const outline = aiOutline.trim();
    if (!outline) {
      toast.validationError("Generate an outline first, then generate an image from it.");
      return;
    }
    setAiLoading("image");
    setGeneratedImageDataUrl(null);
    try {
      const response = await apiClient.aiGenerateImage(outline);
      if (response?.success && response.data?.imageDataUrl) {
        setGeneratedImageDataUrl(response.data.imageDataUrl);
        toast.success("Image generated", "Preview below. Use as featured image or upload to attach.");
      } else {
        toast.apiError(response?.error || "Failed to generate image");
      }
    } catch (error) {
      toast.apiError((error as Error).message || "Failed to generate image");
    } finally {
      setAiLoading("");
    }
  }, [aiOutline, toast]);

  const handleUseAsFeaturedImage = useCallback(() => {
    if (!generatedImageDataUrl) return;
    onCoverImageSet(generatedImageDataUrl);
    toast.success("Featured image set", "You can save the post to keep it.");
  }, [generatedImageDataUrl, onCoverImageSet, toast]);

  const handleUploadAndAttach = useCallback(async () => {
    if (!generatedImageDataUrl || !postId) return;
    setUploadingCover(true);
    try {
      const response = await apiClient.uploadPostCover(postId, generatedImageDataUrl);
      if (response?.success && response.data?.url) {
        onCoverImageSet(response.data.url);
        setGeneratedImageDataUrl(null);
        toast.success("Image uploaded", "Cover image attached to this post.");
      } else {
        toast.apiError(response?.error || "Upload failed");
      }
    } catch (error) {
      toast.apiError((error as Error).message || "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }, [generatedImageDataUrl, postId, onCoverImageSet, toast]);

  return {
    aiKeyword,
    setAiKeyword,
    aiOutline,
    setAiOutline,
    aiLoading,
    generatedImageDataUrl,
    uploadingCover,
    handleGenerateOutline,
    handleGenerateDraft,
    handleGenerateImage,
    handleUseAsFeaturedImage,
    handleUploadAndAttach,
  };
}
