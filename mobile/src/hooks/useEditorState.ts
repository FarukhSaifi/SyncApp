import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { EDITOR_CONFIG } from "@/src/constants/editor";
import { ERRORS, publishedToPlatform, TOAST } from "@/src/constants/messages";
import { PLATFORM_DISPLAY_NAMES, PLATFORMS, type PlatformSlug } from "@/src/constants/platforms";
import { POST_STATUS } from "@/src/constants/postStatus";
import { editorRoute } from "@/src/constants/routes";
import { toast } from "@/src/hooks/useToast";
import { apiClient } from "@/src/services/apiClient";
import type { EditorForm, EditorReadiness } from "@/src/types";

export type { EditorForm };

const INITIAL: EditorForm = {
  title: "",
  content_markdown: "",
  meta_description: "",
  status: POST_STATUS.DRAFT,
  cover_image: "",
  canonical_url: "",
  scheduled_for: "",
  tags: [],
  linkedin_post: "",
  linkedin_read_more_url: "",
};

export function useEditorState(postId?: string) {
  const [form, setForm] = useState<EditorForm>(INITIAL);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(postId);
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformSlug[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const dirtyRef = useRef(false);

  const reloadConnectedPlatforms = useCallback(async () => {
    try {
      setLoadingPlatforms(true);
      const res = await apiClient.getCredentials();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const active = res.data
          .filter(
            (c: unknown): c is { platform_name: string; is_active?: boolean } =>
              typeof c === "object" && c !== null && "platform_name" in c,
          )
          .filter((c) => c.is_active !== false)
          .map((c) => c.platform_name as PlatformSlug)
          .filter((slug) => (Object.values(PLATFORMS) as readonly string[]).includes(slug));
        setConnectedPlatforms(active);
        return;
      }

      // Fallback check per platform in parallel
      const slugs = Object.values(PLATFORMS) as PlatformSlug[];
      const checked = await Promise.allSettled(
        slugs.map(async (slug) => {
          const single = await apiClient.getCredential(slug);
          return single.success && single.data ? slug : null;
        }),
      );
      const activeSlugs = checked
        .filter((r): r is PromiseFulfilledResult<PlatformSlug | null> => r.status === "fulfilled" && r.value !== null)
        .map((r) => r.value as PlatformSlug);
      setConnectedPlatforms(activeSlugs);
    } catch {
      // ignore
    } finally {
      setLoadingPlatforms(false);
    }
  }, []);

  useEffect(() => {
    void reloadConnectedPlatforms();
  }, [reloadConnectedPlatforms]);

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
            linkedin_post: p.linkedin_post ?? "",
            linkedin_read_more_url: p.linkedin_read_more_url ?? "",
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
      linkedin_post: form.linkedin_post || undefined,
      linkedin_read_more_url: form.linkedin_read_more_url || undefined,
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
    async (platform: string, savedPostId?: string) => {
      const slug = platform as PlatformSlug;
      if (!connectedPlatforms.includes(slug)) {
        toast.error(`Please connect your ${PLATFORM_DISPLAY_NAMES[slug] || platform} account in Settings first.`);
        return;
      }
      let id = savedPostId;
      if (!id) {
        const post = await handleSave();
        id = post?._id || post?.id || savedId;
      }
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
    [handleSave, savedId, connectedPlatforms],
  );

  const publishAll = useCallback(
    async (savedPostId?: string) => {
      if (connectedPlatforms.length === 0) {
        toast.error("No platforms connected. Please connect platforms in Settings first.");
        return;
      }
      let id = savedPostId;
      if (!id) {
        const post = await handleSave();
        id = post?._id || post?.id || savedId;
      }
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
    },
    [handleSave, savedId, connectedPlatforms],
  );

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
          linkedin_post: res.data!.linkedin_post || prev.linkedin_post,
          linkedin_read_more_url: res.data!.read_more_url || prev.linkedin_read_more_url,
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

  const generateLinkedInSummary = useCallback(async () => {
    if (!form.title.trim() && !form.content_markdown.trim()) return;
    setAiLoading(true);
    try {
      const res = await apiClient.aiGenerateLinkedInSummary(
        form.title,
        form.content_markdown,
        form.linkedin_read_more_url || form.canonical_url,
      );
      if (res.success && res.data) {
        setForm((prev) => ({
          ...prev,
          linkedin_post: res.data!.linkedin_post,
          linkedin_read_more_url: res.data!.read_more_url || prev.linkedin_read_more_url,
        }));
        dirtyRef.current = true;
        toast.success(TOAST.LINKEDIN_SUMMARY_READY);
      } else {
        toast.error(res.error ?? ERRORS.AI_GENERATION_FAILED);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiLoading(false);
    }
  }, [form.title, form.content_markdown, form.linkedin_read_more_url, form.canonical_url]);

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

  const readiness: EditorReadiness = {
    items: [
      {
        id: "title",
        label: "Title",
        detail: form.title.trim() ? "Ready to review" : "Add a clear headline",
        tone: form.title.trim() ? "ready" : "attention",
        mode: "write",
      },
      {
        id: "content",
        label: "Story",
        detail: form.content_markdown.trim() ? "Draft has content" : "Write the main content",
        tone: form.content_markdown.trim() ? "ready" : "attention",
        mode: "write",
      },
      {
        id: "cover",
        label: "Cover image",
        detail: form.cover_image ? "Image selected" : "Optional, but improves previews",
        tone: form.cover_image ? "ready" : "neutral",
        mode: "write",
      },
      {
        id: "channels",
        label: "Channels",
        detail:
          connectedPlatforms.length > 0
            ? `${connectedPlatforms.length} ${connectedPlatforms.length === 1 ? "platform" : "platforms"} connected`
            : "No platforms connected in Settings",
        tone: connectedPlatforms.length > 0 ? "ready" : "attention",
        mode: "channels",
      },
      {
        id: "details",
        label: "Publishing details",
        detail: form.scheduled_for ? "Scheduled delivery set" : "Publish when ready",
        tone: form.scheduled_for ? "ready" : "neutral",
        mode: "details",
      },
    ],
    completed: [
      form.title.trim(),
      form.content_markdown.trim(),
      form.cover_image,
      connectedPlatforms.length > 0,
      true,
    ].filter(Boolean).length,
    total: 5,
    ready: Boolean(form.title.trim() && form.content_markdown.trim() && connectedPlatforms.length > 0),
  };

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
    generateLinkedInSummary,
    generateImage,
    aiEdit,
    readiness,
    platforms: PLATFORMS,
    connectedPlatforms,
    loadingPlatforms,
    reloadConnectedPlatforms,
  };
}
