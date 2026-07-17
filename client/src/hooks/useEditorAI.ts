/**
 * useEditorAI — AI assistant state and handlers for the editor.
 * Extracted from the monolithic Editor.tsx to keep concerns separated.
 */
import { useCallback, useEffect, useState } from "react";

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
import { applyLinkedInReadMoreUrl, extractLinkedInReadMoreUrl } from "@utils/linkedinPost";

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
  if (raw.title && raw.content) {
    return {
      ...raw,
      linkedin_post: raw.linkedin_post?.trim() || undefined,
      read_more_url: raw.read_more_url?.trim() || undefined,
      linkedin_missing_canonical: Boolean(raw.linkedin_missing_canonical),
    };
  }

  if (raw.content) {
    const parsed = tryParseJSON(raw.content);
    if (parsed) {
      return {
        title: (parsed.title as string) || raw.title || "",
        meta_description: (parsed.meta_description as string) || raw.meta_description || "",
        tags: Array.isArray(parsed.tags) ? (parsed.tags as string[]) : (raw.tags ?? []),
        content: (parsed.content_markdown as string) || (parsed.content as string) || raw.content,
        linkedin_post:
          (typeof parsed.linkedin_post === "string" && parsed.linkedin_post.trim()) || raw.linkedin_post || undefined,
        read_more_url:
          (typeof parsed.read_more_url === "string" && parsed.read_more_url.trim()) || raw.read_more_url || undefined,
        linkedin_missing_canonical: Boolean(parsed.linkedin_missing_canonical ?? raw.linkedin_missing_canonical),
      };
    }
  }

  return raw;
}

interface UseEditorAIOptions {
  postId?: string;
  /** Preferred public article URL for LinkedIn Read more (post canonical). */
  preferredReadMoreUrl?: string;
  /** Current editor title + body for LinkedIn-only summary generation. */
  getArticleContext: () => { title: string; content: string };
  onDraftGenerated: (data: GeneratedPostData) => void;
  onLinkedInSummaryGenerated: (data: {
    linkedin_post: string;
    read_more_url?: string;
    linkedin_missing_canonical?: boolean;
  }) => void;
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
  linkedinPost: string | null;
  linkedinReadMoreUrl: string | null;
  linkedinMissingCanonical: boolean;
  handleGeneratePost: () => Promise<void>;
  handleGenerateLinkedInSummary: () => Promise<void>;
  handleGenerateImage: () => Promise<void>;
  handleUseAsFeaturedImage: () => void;
  handleUploadAndAttach: () => Promise<void>;
  handleCopyLinkedInPost: () => Promise<void>;
  hydrateLinkedInPost: (post: string | null, missingCanonical?: boolean) => void;
  clearLinkedInPost: () => void;
}

export function useEditorAI({
  postId,
  preferredReadMoreUrl,
  getArticleContext,
  onDraftGenerated,
  onLinkedInSummaryGenerated,
  onCoverImageSet,
}: UseEditorAIOptions): UseEditorAIReturn {
  const toast = useToast();
  const [aiKeyword, setAiKeyword] = useState("");
  const [aiModel, setAiModelState] = useState(() => readStoredAiModel());
  const [targetPlatforms, setTargetPlatformsState] = useState<string[]>(() => readStoredOptimizationTargets());
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [aiLoading, setAiLoading] = useState("");
  const [generatedImageDataUrl, setGeneratedImageDataUrl] = useState<string | null>(null);
  const [generatedImageSource, setGeneratedImageSource] = useState<AiImageSource | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [linkedinPost, setLinkedinPost] = useState<string | null>(null);
  const [linkedinMissingCanonical, setLinkedinMissingCanonical] = useState(false);

  const linkedinReadMoreUrl = linkedinPost ? extractLinkedInReadMoreUrl(linkedinPost) : null;

  useEffect(() => {
    if (!linkedinPost || !preferredReadMoreUrl) return;
    const next = applyLinkedInReadMoreUrl(linkedinPost, preferredReadMoreUrl);
    if (next !== linkedinPost) {
      setLinkedinPost(next);
      setLinkedinMissingCanonical(false);
    }
  }, [preferredReadMoreUrl, linkedinPost]);

  const setAiModel = useCallback((model: string) => {
    const resolved = resolveStoredContentModel(model);
    setAiModelState(resolved);
    persistAiModel(resolved);
  }, []);

  const setTargetPlatforms = useCallback((platforms: string[]) => {
    setTargetPlatformsState(platforms);
    persistOptimizationTargets(platforms);
  }, []);

  const clearLinkedInPost = useCallback(() => {
    setLinkedinPost(null);
    setLinkedinMissingCanonical(false);
  }, []);

  const hydrateLinkedInPost = useCallback((post: string | null, missingCanonical = false) => {
    const text = (post || "").trim();
    if (!text) {
      setLinkedinPost(null);
      setLinkedinMissingCanonical(false);
      return;
    }
    setLinkedinPost(text);
    setLinkedinMissingCanonical(missingCanonical);
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

        const withPreferredUrl =
          data.linkedin_post && preferredReadMoreUrl
            ? {
                ...data,
                linkedin_post: applyLinkedInReadMoreUrl(data.linkedin_post, preferredReadMoreUrl),
                linkedin_missing_canonical: false,
                read_more_url: preferredReadMoreUrl,
              }
            : data;

        if (withPreferredUrl.linkedin_post?.trim()) {
          setLinkedinPost(withPreferredUrl.linkedin_post.trim());
          setLinkedinMissingCanonical(Boolean(withPreferredUrl.linkedin_missing_canonical));
        } else {
          clearLinkedInPost();
        }

        onDraftGenerated(withPreferredUrl);
        toast.success(TOAST_TITLES.POST_GENERATED, SYNC_LABEL.AI_POST_GENERATED);
        if (withPreferredUrl.linkedin_post && withPreferredUrl.linkedin_missing_canonical) {
          toast.warning(TOAST_TITLES.WARNING, SYNC_LABEL.AI_LINKEDIN_MISSING_CANONICAL);
        }
      } else {
        toast.apiError(response?.error || SYNC_LABEL.FAILED_TO_GENERATE_POST);
      }
    } catch (error) {
      toast.apiError((error as Error).message || SYNC_LABEL.FAILED_TO_GENERATE_POST);
    } finally {
      setAiLoading("");
    }
  }, [aiKeyword, aiModel, clearLinkedInPost, onDraftGenerated, preferredReadMoreUrl, targetPlatforms, toast]);

  const handleGenerateLinkedInSummary = useCallback(async () => {
    const { title, content } = getArticleContext();
    const titleTrim = title.trim();
    const contentTrim = content.trim();
    if (!titleTrim && !contentTrim) {
      toast.validationError(SYNC_LABEL.AI_LINKEDIN_SUMMARY_CONTEXT_REQUIRED);
      return;
    }
    setAiLoading("linkedin");
    try {
      const response = await apiClient.aiGenerateLinkedInSummary({
        title: titleTrim,
        content: contentTrim,
        model: aiModel,
        readMoreUrl: preferredReadMoreUrl,
      });
      if (response?.success && response.data?.linkedin_post?.trim()) {
        let postText = response.data.linkedin_post.trim();
        let missingCanonical = Boolean(response.data.linkedin_missing_canonical);
        let readMore = response.data.read_more_url?.trim() || preferredReadMoreUrl;

        if (preferredReadMoreUrl) {
          postText = applyLinkedInReadMoreUrl(postText, preferredReadMoreUrl);
          readMore = preferredReadMoreUrl;
          missingCanonical = false;
        }

        setLinkedinPost(postText);
        setLinkedinMissingCanonical(missingCanonical);
        onLinkedInSummaryGenerated({
          linkedin_post: postText,
          read_more_url: readMore,
          linkedin_missing_canonical: missingCanonical,
        });
        toast.success(TOAST_TITLES.LINKEDIN_SUMMARY_GENERATED, SYNC_LABEL.AI_LINKEDIN_SUMMARY_GENERATED);
        if (missingCanonical) {
          toast.warning(TOAST_TITLES.WARNING, SYNC_LABEL.AI_LINKEDIN_MISSING_CANONICAL);
        }
      } else {
        toast.apiError(response?.error || SYNC_LABEL.FAILED_TO_GENERATE_LINKEDIN_SUMMARY);
      }
    } catch (error) {
      toast.apiError((error as Error).message || SYNC_LABEL.FAILED_TO_GENERATE_LINKEDIN_SUMMARY);
    } finally {
      setAiLoading("");
    }
  }, [aiModel, getArticleContext, onLinkedInSummaryGenerated, preferredReadMoreUrl, toast]);

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

  const handleCopyLinkedInPost = useCallback(async () => {
    if (!linkedinPost?.trim()) return;
    try {
      await navigator.clipboard.writeText(linkedinPost);
      toast.success(TOAST_TITLES.LINKEDIN_COPIED, SYNC_LABEL.AI_LINKEDIN_COPIED);
    } catch {
      toast.apiError(SYNC_LABEL.FAILED_TO_COPY_LINKEDIN);
    }
  }, [linkedinPost, toast]);

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
    linkedinPost,
    linkedinReadMoreUrl,
    linkedinMissingCanonical,
    handleGeneratePost,
    handleGenerateLinkedInSummary,
    handleGenerateImage,
    handleUseAsFeaturedImage,
    handleUploadAndAttach,
    handleCopyLinkedInPost,
    hydrateLinkedInPost,
    clearLinkedInPost,
  };
}
