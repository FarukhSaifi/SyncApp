/**
 * useEditorAI — AI assistant state and handlers for the editor.
 * Extracted from the monolithic Editor.tsx to keep concerns separated.
 */
import { useCallback, useState } from "react";

import { useToast } from "@hooks/useToast";
import type { GeneratedPostData } from "@types";
import { apiClient } from "@utils/apiClient";

/**
 * Strips markdown code fences and parses JSON from a string.
 * Returns null if the string is not valid JSON after stripping fences.
 */
function tryParseJSON(raw: string): Record<string, unknown> | null {
  try {
    const clean = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    return JSON.parse(clean);
  } catch {
    // Try extracting first { ... } block
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Normalises the raw API response into a clean GeneratedPostData.
 * Handles the case where the server returns the full JSON as a code-fenced
 * string inside the `content` field instead of parsed fields.
 */
function parseAIResponse(raw: GeneratedPostData): GeneratedPostData {
  // Happy path: server already parsed everything correctly
  if (raw.title && raw.content) return raw;

  // Fallback: content holds the raw JSON string – parse it client-side
  if (raw.content) {
    const parsed = tryParseJSON(raw.content);
    if (parsed) {
      return {
        title: (parsed.title as string) || raw.title || "",
        meta_description: (parsed.meta_description as string) || raw.meta_description || "",
        tags: Array.isArray(parsed.tags) ? (parsed.tags as string[]) : (raw.tags ?? []),
        content: (parsed.content_markdown as string) || (parsed.content as string) || raw.content,
      };
    }
  }

  return raw;
}

interface UseEditorAIOptions {
  postId?: string;
  onDraftGenerated: (data: GeneratedPostData) => void;
  onCoverImageSet: (url: string) => void;
}

interface UseEditorAIReturn {
  aiKeyword: string;
  setAiKeyword: (v: string) => void;
  aiImagePrompt: string;
  setAiImagePrompt: (v: string) => void;
  aiLoading: string;
  generatedImageDataUrl: string | null;
  uploadingCover: boolean;
  handleGeneratePost: () => Promise<void>;
  handleGenerateImage: () => Promise<void>;
  handleUseAsFeaturedImage: () => void;
  handleUploadAndAttach: () => Promise<void>;
}

export function useEditorAI({ postId, onDraftGenerated, onCoverImageSet }: UseEditorAIOptions): UseEditorAIReturn {
  const toast = useToast();
  const [aiKeyword, setAiKeyword] = useState("");
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [aiLoading, setAiLoading] = useState("");
  const [generatedImageDataUrl, setGeneratedImageDataUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleGeneratePost = useCallback(async () => {
    const keyword = aiKeyword.trim();
    if (!keyword) {
      toast.validationError("Enter a keyword or topic");
      return;
    }
    setAiLoading("post");
    try {
      const response = await apiClient.aiGenerate(keyword);
      if (response?.success && response.data) {
        const data = parseAIResponse(response.data as GeneratedPostData);
        if (!data.content) {
          toast.apiError(response?.error || "Failed to generate post");
          return;
        }
        onDraftGenerated(data);
        toast.success("Post generated", "Draft added to the editor.");
      } else {
        toast.apiError(response?.error || "Failed to generate post");
      }
    } catch (error) {
      toast.apiError((error as Error).message || "Failed to generate post");
    } finally {
      setAiLoading("");
    }
  }, [aiKeyword, onDraftGenerated, toast]);

  const handleGenerateImage = useCallback(async () => {
    const topic = aiKeyword.trim();
    if (!topic) {
      toast.validationError("Enter a keyword or topic first to generate an image.");
      return;
    }
    setAiLoading("image");
    setGeneratedImageDataUrl(null);
    try {
      const response = await apiClient.aiGenerateImage(topic, aiImagePrompt.trim() || undefined);
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
  }, [aiKeyword, aiImagePrompt, toast]);

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
        // Cache the base64 URL with the public GCS URL as the key to allow direct preview bypass
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`cover_preview_${response.data.url}`, generatedImageDataUrl);
        }
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
    aiImagePrompt,
    setAiImagePrompt,
    aiLoading,
    generatedImageDataUrl,
    uploadingCover,
    handleGeneratePost,
    handleGenerateImage,
    handleUseAsFeaturedImage,
    handleUploadAndAttach,
  };
}
