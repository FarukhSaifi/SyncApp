/**
 * useEditorState — Centralized editor form state, save/publish handlers, autosave, dirty tracking.
 * Extracted from the monolithic Editor.tsx.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@hooks/useToast";
import type { Post } from "@types";
import { apiClient } from "@utils/apiClient";
import { devError, devLog } from "@utils/logger";
import { useParams, useRouter } from "next/navigation";

import { AUTOSAVE_INTERVAL_MS, INITIAL_EDITOR_FORM } from "@constants/editor";
import { CANONICAL_BASE_URL } from "@constants/index";
import { SYNC_LABEL } from "@constants/messages";
import { POST_STATUS } from "@constants/postStatus";

/**
 * Build a canonical URL from the post slug.
 * - If NEXT_PUBLIC_CANONICAL_BASE_URL is set: `<base>/<slug>`
 * - Otherwise falls back to just the slug.
 */
function buildClientCanonicalUrl(slug?: string): string {
  if (!slug) return "";
  return CANONICAL_BASE_URL ? `${CANONICAL_BASE_URL}/${slug}` : slug;
}

export interface EditorFormData {
  title: string;
  content_markdown: string;
  meta_description: string;
  cover_image: string;
  canonical_url: string;
  scheduled_for: string;
  status: string;
  [key: string]: string | string[];
}

interface UseEditorStateOptions {
  onPostCreate: (post: Post) => void;
  onPostUpdate: (post: Post) => void;
}

export function useEditorState({ onPostCreate, onPostUpdate }: UseEditorStateOptions) {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const toast = useToast();

  const [formData, setFormData] = useState<EditorFormData>({ ...INITIAL_EDITOR_FORM });
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const isDirtyRef = useRef(isDirty);
  const formDataRef = useRef(formData);
  const tagListRef = useRef(tagList);

  // Sync ref values safely inside useEffect to avoid render-phase mutation warnings in React 19
  useEffect(() => {
    isDirtyRef.current = isDirty;
    formDataRef.current = formData;
    tagListRef.current = tagList;
  }, [isDirty, formData, tagList]);

  const fetchPost = useCallback(async () => {
    try {
      devLog("Fetching post:", id);
      const response = await apiClient.getPost(id!);
      if (response?.success && response.data) {
        const post = response.data;
        setFormData({
          title: post.title || "",
          content_markdown: post.content_markdown || "",
          meta_description: post.meta_description || "",
          status: post.status,
          cover_image: post.cover_image || "",
          canonical_url: post.canonical_url || buildClientCanonicalUrl(post.slug),
          scheduled_for: post.scheduled_for || "",
        });
        setTagList(Array.isArray(post.tags) ? post.tags : []);
        setIsDirty(false);
      } else {
        toast.apiError(response?.error || "Failed to fetch post");
      }
    } catch (error) {
      devError("Error fetching post:", error);
      toast.apiError(`Failed to fetch post: ${(error as Error).message}`);
    }
  }, [id, toast]);

  /** Silent save (for autosave) — no navigation, no toast */
  const handleSaveQuiet = useCallback(async () => {
    if (!id || !formDataRef.current.title.trim() || !formDataRef.current.content_markdown.trim()) return;
    try {
      const postData = { ...formDataRef.current, tags: tagListRef.current };
      await apiClient.updatePost(id, postData);
      setIsDirty(false);
      setLastSavedAt(new Date());
    } catch {
      // Silent fail for autosave
    }
  }, [id]);

  // Fetch post on mount if editing
  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id, fetchPost]);

  // Track dirty state
  useEffect(() => {
    setIsDirty(true);
  }, [formData, tagList]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Autosave
  useEffect(() => {
    if (!id) return; // Only autosave existing posts
    const interval = setInterval(() => {
      if (isDirtyRef.current && formDataRef.current.title.trim() && formDataRef.current.content_markdown.trim()) {
        handleSaveQuiet();
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [id, handleSaveQuiet]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateFormField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tagList.includes(tag)) {
      setTagList((prev) => [...prev, tag]);
      setTagInput("");
    }
  }, [tagInput, tagList]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTagList((prev) => prev.filter((t) => t !== tagToRemove));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag],
  );

  const handleSave = useCallback(
    async (forceStatus?: string) => {
      if (!formData.title.trim() || !formData.content_markdown.trim()) {
        toast.validationError(SYNC_LABEL.FILL_TITLE_AND_CONTENT);
        return;
      }

      const status = forceStatus ?? formData.status ?? POST_STATUS.DRAFT;

      setLoading(true);
      try {
        const postData = { ...formData, tags: tagList, status };
        devLog("Saving post:", id ? "update" : "create");
        let response;
        if (id) {
          response = await apiClient.updatePost(id, postData);
        } else {
          response = await apiClient.createPost(postData);
        }
        devLog("💾 Save response:", response);

        if (response?.success) {
          const savedPost = response.data;
          if (savedPost) {
            setFormData((prev) => ({
              ...prev,
              status: savedPost.status ?? status,
              // Prefer server's canonical_url, then build from slug, then keep whatever user had.
              canonical_url: savedPost.canonical_url || buildClientCanonicalUrl(savedPost.slug) || prev.canonical_url,
              cover_image: savedPost.cover_image ?? prev.cover_image,
              content_markdown: savedPost.content_markdown ?? prev.content_markdown,
            }));
          }
          if (id) {
            if (savedPost) onPostUpdate(savedPost);
            toast.saveSuccess(true);
          } else {
            if (savedPost) onPostCreate(savedPost);
            toast.saveSuccess(false);
          }
          setIsDirty(false);
          setLastSavedAt(new Date());
          const isNewPost = !id;
          if (forceStatus === POST_STATUS.DRAFT || (isNewPost && status === POST_STATUS.DRAFT)) {
            router.push("/");
          }
        } else {
          toast.apiError(response?.error || "Failed to save post");
        }
      } catch (error) {
        devError("Error saving post:", error);
        toast.apiError(`Failed to save post: ${(error as Error).message}`);
      } finally {
        setLoading(false);
      }
    },
    [formData, tagList, id, onPostUpdate, onPostCreate, router, toast],
  );

  /** Ensures post exists and latest edits are saved before publishing */
  const ensurePostSaved = useCallback(async (): Promise<string | null> => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      return null;
    }

    const status = formData.status ?? POST_STATUS.DRAFT;
    const postData = { ...formData, tags: tagList, status };

    if (!id) {
      devLog("Saving new post before publishing");
      const saveResponse = await apiClient.createPost(postData);
      if (!saveResponse?.success || !saveResponse.data) {
        throw new Error(saveResponse?.error || "Failed to save post");
      }
      onPostCreate(saveResponse.data);
      return saveResponse.data._id;
    }

    devLog("Saving post edits before publishing");
    const saveResponse = await apiClient.updatePost(id, postData);
    if (!saveResponse?.success) {
      throw new Error(saveResponse?.error || "Failed to save post");
    }
    if (saveResponse.data) {
      onPostUpdate(saveResponse.data);
    }
    return id;
  }, [id, formData, tagList, onPostCreate, onPostUpdate]);

  const handlePublishToPlatform = useCallback(
    async (platform: string) => {
      if (!formData.title.trim() || !formData.content_markdown.trim()) {
        toast.validationError(SYNC_LABEL.FILL_TITLE_AND_CONTENT);
        return;
      }
      setPublishing(true);
      try {
        const currentPostId = await ensurePostSaved();
        if (!currentPostId) return;

        devLog(`Publishing to ${platform}`);
        const publishResponse = await apiClient.publish(platform, currentPostId);
        if (publishResponse?.success) {
          if (publishResponse.data) onPostUpdate(publishResponse.data);
          toast.publishSuccess(platform, publishResponse.message);
          router.push("/");
        } else {
          throw new Error(publishResponse?.error || `Failed to publish to ${platform}`);
        }
      } catch (error) {
        devError(`Error publishing to ${platform}:`, error);
        toast.publishError(platform, (error as Error).message);
      } finally {
        setPublishing(false);
      }
    },
    [formData.title, formData.content_markdown, ensurePostSaved, onPostUpdate, router, toast],
  );

  const handlePublishToAll = useCallback(async () => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      toast.validationError(SYNC_LABEL.FILL_TITLE_AND_CONTENT);
      return;
    }
    setPublishing(true);
    try {
      const currentPostId = await ensurePostSaved();
      if (!currentPostId) return;

      devLog("Publishing to all platforms");
      const publishResponse = await apiClient.publishAll(currentPostId);
      if (publishResponse?.success) {
        if (publishResponse.data) onPostUpdate(publishResponse.data);
        toast.success(
          "Published Everywhere!",
          publishResponse.message || "Post published to all platforms successfully!",
        );
        router.push("/");
      } else {
        throw new Error(publishResponse?.error || "Failed to publish to all platforms");
      }
    } catch (error) {
      devError("Error publishing to all platforms:", error);
      toast.error("Publish Failed", `Failed to publish to all platforms: ${(error as Error).message}`);
    } finally {
      setPublishing(false);
    }
  }, [formData.title, formData.content_markdown, ensurePostSaved, onPostUpdate, router, toast]);

  const handleDownloadMdx = useCallback(async () => {
    try {
      if (!id) {
        toast.validationError(SYNC_LABEL.SAVE_FIRST_BEFORE_EXPORT);
        return;
      }
      await apiClient.downloadMdx(id);
      toast.exportSuccess("MDX");
    } catch (e) {
      toast.exportError("MDX", (e as Error).message || "Could not export MDX");
    }
  }, [id, toast]);

  const togglePreview = useCallback(() => {
    setActiveTab((prev) => (prev === "edit" ? "preview" : "edit"));
  }, []);

  return {
    // Identifiers
    id,
    router,
    // Form state
    formData,
    setFormData,
    tagList,
    setTagList,
    tagInput,
    setTagInput,
    // UI state
    loading,
    publishing,
    activeTab,
    setActiveTab,
    isDirty,
    lastSavedAt,
    // Handlers
    handleInputChange,
    updateFormField,
    handleAddTag,
    handleRemoveTag,
    handleTagKeyDown,
    handleSave,
    handlePublishToPlatform,
    handlePublishToAll,
    handleDownloadMdx,
    togglePreview,
  };
}
