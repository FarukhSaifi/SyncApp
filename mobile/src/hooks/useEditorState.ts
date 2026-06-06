import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { EDITOR_CONFIG } from "@/src/constants/editor";
import { ERRORS, TOAST, publishedToPlatform } from "@/src/constants/messages";
import { PLATFORMS } from "@/src/constants/platforms";
import { POST_STATUS } from "@/src/constants/postStatus";
import { editorRoute } from "@/src/constants/routes";
import { toast } from "@/src/hooks/useToast";
import { apiClient } from "@/src/services/apiClient";

export interface EditorForm {
  title: string;
  content_markdown: string;
  meta_description: string;
  status: string;
  cover_image: string;
  canonical_url: string;
  scheduled_for: string;
  tags: string[];
}

const INITIAL: EditorForm = {
  title: "",
  content_markdown: "",
  meta_description: "",
  status: POST_STATUS.DRAFT,
  cover_image: "",
  canonical_url: "",
  scheduled_for: "",
  tags: [],
};

export function useEditorState(postId?: string) {
  const [form, setForm] = useState<EditorForm>(INITIAL);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(postId);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!postId) return;
    void (async () => {
      try {
        const res = await apiClient.getPost(postId);
        if (res.success && res.data) {
          const p = res.data;
          setForm({
            title: p.title ?? "",
            content_markdown: p.content_markdown ?? "",
            meta_description: p.meta_description ?? "",
            status: p.status ?? POST_STATUS.DRAFT,
            cover_image: p.cover_image ?? "",
            canonical_url: p.canonical_url ?? "",
            scheduled_for: p.scheduled_for ?? "",
            tags: p.tags ?? [],
          });
        }
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  const updateField = useCallback(<K extends keyof EditorForm>(key: K, value: EditorForm[K]) => {
    dirtyRef.current = true;
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const buildPayload = useCallback(
    (forceStatus?: string) => ({
      title: form.title,
      content_markdown: form.content_markdown,
      meta_description: form.meta_description,
      status: forceStatus ?? form.status ?? POST_STATUS.DRAFT,
      cover_image: form.cover_image || undefined,
      canonical_url: form.canonical_url || undefined,
      scheduled_for: form.scheduled_for || null,
      tags: form.tags,
    }),
    [form],
  );

  const handleSave = useCallback(
    async (forceStatus?: string) => {
      if (!form.title.trim() || !form.content_markdown.trim()) {
        toast.error(ERRORS.TITLE_CONTENT_REQUIRED);
        return null;
      }
      setSaving(true);
      try {
        const payload = buildPayload(forceStatus);
        const id = savedId;
        const res = id ? await apiClient.updatePost(id, payload) : await apiClient.createPost(payload);
        if (res.success && res.data) {
          const newId = res.data._id || res.data.id;
          if (newId && !savedId) {
            setSavedId(newId);
            router.replace(editorRoute(newId));
          }
          if (res.data.status) {
            setForm((prev) => ({ ...prev, status: res.data!.status }));
          }
          dirtyRef.current = false;
          toast.success(TOAST.SAVED);
          return res.data;
        }
        toast.error(res.error ?? ERRORS.SAVE_FAILED);
        return null;
      } catch (e) {
        toast.error((e as Error).message);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [form, savedId, buildPayload],
  );

  useEffect(() => {
    if (!savedId) return;
    const interval = setInterval(() => {
      if (dirtyRef.current && form.title.trim() && form.content_markdown.trim()) {
        void handleSave();
      }
    }, EDITOR_CONFIG.AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [savedId, form.title, form.content_markdown, handleSave]);

  const publish = useCallback(
    async (platform: string) => {
      const post = await handleSave();
      const id = post?._id || post?.id || savedId;
      if (!id) return;
      setPublishing(true);
      try {
        const res = await apiClient.publish(platform, id);
        if (res.success) {
          toast.success(res.message ?? publishedToPlatform(platform));
        } else {
          toast.error(res.error ?? ERRORS.PUBLISH_FAILED);
        }
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setPublishing(false);
      }
    },
    [handleSave, savedId],
  );

  const publishAll = useCallback(async () => {
    const post = await handleSave();
    const id = post?._id || post?.id || savedId;
    if (!id) return;
    setPublishing(true);
    try {
      const res = await apiClient.publishAll(id);
      if (res.success) {
        toast.success(res.message ?? TOAST.PUBLISHED_ALL);
      } else {
        toast.error(res.error ?? ERRORS.PUBLISH_FAILED);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPublishing(false);
    }
  }, [handleSave, savedId]);

  const generatePost = useCallback(async (keyword: string) => {
    if (!keyword.trim()) return;
    setAiLoading(true);
    try {
      const res = await apiClient.aiGenerate(keyword.trim());
      if (res.success && res.data) {
        setForm((prev) => ({
          ...prev,
          title: res.data!.title || prev.title,
          meta_description: res.data!.meta_description || prev.meta_description,
          content_markdown: res.data!.content || prev.content_markdown,
          tags: res.data!.tags?.length ? res.data!.tags : prev.tags,
        }));
        dirtyRef.current = true;
        toast.success(TOAST.AI_DRAFT_GENERATED);
      } else {
        toast.error(res.error ?? ERRORS.AI_GENERATION_FAILED);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiLoading(false);
    }
  }, []);

  const generateImage = useCallback(
    async (topic: string) => {
      setAiLoading(true);
      try {
        const res = await apiClient.aiGenerateImage(topic, EDITOR_CONFIG.AI_IMAGE_STYLE_PROMPT);
        if (res.success && res.data?.imageDataUrl) {
          updateField("cover_image", res.data.imageDataUrl);
          toast.success(TOAST.IMAGE_GENERATED);
        } else {
          toast.error(res.error ?? ERRORS.AI_IMAGE_FAILED);
        }
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setAiLoading(false);
      }
    },
    [updateField],
  );

  const aiEdit = useCallback(
    async (action: string) => {
      if (!form.content_markdown.trim()) return;
      setAiLoading(true);
      try {
        const res = await apiClient.aiEdit(action, form.content_markdown);
        if (res.success && res.data?.result) {
          updateField("content_markdown", res.data.result);
          toast.success(TOAST.CONTENT_UPDATED);
        } else {
          toast.error(res.error ?? ERRORS.AI_EDIT_FAILED);
        }
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setAiLoading(false);
      }
    },
    [form.content_markdown, updateField],
  );

  return {
    form,
    loading,
    saving,
    publishing,
    aiLoading,
    savedId,
    updateField,
    handleSave,
    publish,
    publishAll,
    generatePost,
    generateImage,
    aiEdit,
    platforms: PLATFORMS,
  };
}
