/**
 * useEditorAI — AI assistant state and handlers for the editor.
 * Extracted from the monolithic Editor.tsx to keep concerns separated.
 */
import { useCallback, useState } from "react";

import { useToast } from "@hooks/useToast";
import type { AiContentModel, AiImageSource, GeneratedPostData } from "@types";
import {
  persistAiModel,
  persistOptimizationTargets,
  readStoredAiModel,
  readStoredOptimizationTargets,
} from "@utils/aiPreferences";
import { apiClient } from "@utils/apiClient";

import { AI_CONTENT_MODELS, resolveStoredContentModel } from "@constants/ai";
import { SYNC_LABEL, TOAST_TITLES } from "@constants/messages";

function tryParseJSON(raw: string): Record<string, unknown> | null {
  try {
    const clean = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    return JSON.parse(clean);
  } catch {
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

function parseAIResponse(raw: GeneratedPostData): GeneratedPostData {
  if (raw.title && raw.content) return raw;

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
  aiModel: string;
  setAiModel: (v: string) => void;
  aiModels: AiContentModel[];
  targetPlatforms: string[];
  setTargetPlatforms: (platforms: string[]) => void;
  aiImagePrompt: string;
  setAiImagePrompt: (v: string) => void;
  aiLoading: string;
  generatedImageDataUrl: string | null;
  generatedImageSource: AiImageSource | null;
  uploadingCover: boolean;
  handleGeneratePost: () => Promise<void>;
  handleGenerateImage: () => Promise<void>;
  handleUseAsFeaturedImage: () => void;
  handleUploadAndAttach: () => Promise<void>;
}

export function useEditorAI({ postId, onDraftGenerated, onCoverImageSet }: UseEditorAIOptions): UseEditorAIReturn {
  const toast = useToast();
  const [aiKeyword, setAiKeyword] = useState("");
  const [aiModel, setAiModelState] = useState(() => readStoredAiModel());
  const [targetPlatforms, setTargetPlatformsState] = useState<string[]>(() => readStoredOptimizationTargets());
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [aiLoading, setAiLoading] = useState("");
  const [generatedImageDataUrl, setGeneratedImageDataUrl] = useState<string | null>(null);
  const [generatedImageSource, setGeneratedImageSource] = useState<AiImageSource | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const setAiModel = useCallback((model: string) => {
    const resolved = resolveStoredContentModel(model);
    setAiModelState(resolved);
    persistAiModel(resolved);
  }, []);

  const setTargetPlatforms = useCallback((platforms: string[]) => {
    setTargetPlatformsState(platforms);
    persistOptimizationTargets(platforms);
  }, []);

  const handleGeneratePost = useCallback(async () => {
    const keyword = aiKeyword.trim();
    if (!keyword) {
      toast.validationError(SYNC_LABEL.AI_KEYWORD_REQUIRED);
      return;
    }
    if (targetPlatforms.length === 0) {
      toast.validationError(SYNC_LABEL.AI_TARGETS_REQUIRED);
      return;
    }
    setAiLoading("post");
    try {
      const response = await apiClient.aiGenerate(keyword, {
        model: aiModel,
        targetPlatforms,
      });
      if (response?.success && response.data) {
        const data = parseAIResponse(response.data as GeneratedPostData);
        if (!data.content) {
          toast.apiError(response?.error || SYNC_LABEL.FAILED_TO_GENERATE_POST);
          return;
        }
        onDraftGenerated(data);
        toast.success(TOAST_TITLES.POST_GENERATED, SYNC_LABEL.AI_POST_GENERATED);
      } else {
        toast.apiError(response?.error || SYNC_LABEL.FAILED_TO_GENERATE_POST);
      }
    } catch (error) {
      toast.apiError((error as Error).message || SYNC_LABEL.FAILED_TO_GENERATE_POST);
    } finally {
      setAiLoading("");
    }
  }, [aiKeyword, aiModel, onDraftGenerated, targetPlatforms, toast]);

  const handleGenerateImage = useCallback(async () => {
    const topic = aiKeyword.trim();
    if (!topic) {
      toast.validationError(SYNC_LABEL.AI_KEYWORD_REQUIRED_FOR_IMAGE);
      return;
    }
    setAiLoading("image");
    setGeneratedImageDataUrl(null);
    setGeneratedImageSource(null);
    try {
      const response = await apiClient.aiGenerateImage(topic, aiImagePrompt.trim() || undefined);
      if (response?.success && response.data?.imageDataUrl) {
        setGeneratedImageDataUrl(response.data.imageDataUrl);
        setGeneratedImageSource(response.data.source || null);
        toast.success(
          TOAST_TITLES.IMAGE_GENERATED,
          response.data.source === "svg_fallback" ? SYNC_LABEL.AI_IMAGE_SVG_FALLBACK : SYNC_LABEL.AI_IMAGE_GENERATED,
        );
      } else {
        toast.apiError(response?.error || SYNC_LABEL.FAILED_TO_GENERATE_IMAGE);
      }
    } catch (error) {
      toast.apiError((error as Error).message || SYNC_LABEL.FAILED_TO_GENERATE_IMAGE);
    } finally {
      setAiLoading("");
    }
  }, [aiKeyword, aiImagePrompt, toast]);

  const handleUseAsFeaturedImage = useCallback(() => {
    if (!generatedImageDataUrl) return;
    onCoverImageSet(generatedImageDataUrl);
    toast.success(TOAST_TITLES.FEATURED_IMAGE_SET, SYNC_LABEL.AI_FEATURED_IMAGE_SET);
  }, [generatedImageDataUrl, onCoverImageSet, toast]);

  const handleUploadAndAttach = useCallback(async () => {
    if (!generatedImageDataUrl || !postId) return;
    setUploadingCover(true);
    try {
      const response = await apiClient.uploadPostCover(postId, generatedImageDataUrl);
      if (response?.success && response.data?.url) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`cover_preview_${response.data.url}`, generatedImageDataUrl);
        }
        onCoverImageSet(response.data.url);
        setGeneratedImageDataUrl(null);
        toast.success(TOAST_TITLES.IMAGE_UPLOADED, SYNC_LABEL.AI_COVER_ATTACHED);
      } else {
        toast.apiError(response?.error || SYNC_LABEL.FAILED_TO_UPLOAD_COVER);
      }
    } catch (error) {
      toast.apiError((error as Error).message || SYNC_LABEL.FAILED_TO_UPLOAD_COVER);
    } finally {
      setUploadingCover(false);
    }
  }, [generatedImageDataUrl, postId, onCoverImageSet, toast]);

  return {
    aiKeyword,
    setAiKeyword,
    aiModel,
    setAiModel,
    aiModels: [...AI_CONTENT_MODELS],
    targetPlatforms,
    setTargetPlatforms,
    aiImagePrompt,
    setAiImagePrompt,
    aiLoading,
    generatedImageDataUrl,
    generatedImageSource,
    uploadingCover,
    handleGeneratePost,
    handleGenerateImage,
    handleUseAsFeaturedImage,
    handleUploadAndAttach,
  };
}
