import "quill/dist/quill.snow.css";
import React, { useEffect, useRef, useState } from "react";
import { FiArrowUp, FiEdit2, FiEye, FiGlobe, FiImage, FiSave, FiSend, FiUpload, FiX, FiZap } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import { useQuill } from "react-quilljs";
import { useNavigate, useParams } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import Button from "@components/common/Button";
import { Card, CardContent } from "@components/common/Card";
import Input from "@components/common/Input";

import { useToast } from "@hooks/useToast";

import { apiClient } from "@utils/apiClient";
import { contentForQuill, isLikelyHtml } from "@utils/contentUtils";
import { devError, devLog } from "@utils/logger";

import {
  INITIAL_EDITOR_FORM,
  PAGE_DESCRIPTIONS,
  PAGE_TITLES,
  QUILL_MODULES,
  SCROLL_TO_TOP_THRESHOLD,
  SYNC_LABEL,
} from "@constants";
import type { Post } from "@types";

interface EditorProps {
  onPostCreate: (post: Post) => void;
  onPostUpdate: (post: Post) => void;
}

interface FormData {
  title: string;
  content_markdown: string;
  status: string;
  cover_image: string;
  canonical_url: string;
  [key: string]: string;
}

const Editor = ({ onPostCreate, onPostUpdate }: EditorProps) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [aiKeyword, setAiKeyword] = useState<string>("");
  const [aiOutline, setAiOutline] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<string>("");
  const [generatedImageDataUrl, setGeneratedImageDataUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_EDITOR_FORM });

  const { quill, quillRef } = useQuill({
    theme: "snow",
    modules: QUILL_MODULES,
    placeholder: SYNC_LABEL.POST_CONTENT,
  }) as { quill: unknown; quillRef: React.RefObject<HTMLDivElement> };

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > SCROLL_TO_TOP_THRESHOLD);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /** Sync Quill content into formData and switch to Preview so the preview shows the latest editor content. */
  const handleSwitchToPreview = () => {
    if (quill) {
      const q = quill as { root: { innerHTML: string } };
      const html = q.root.innerHTML;
      setFormData((prev) => ({ ...prev, content_markdown: html }));
    }
    setActiveTab("preview");
  };

  const fetchPost = async () => {
    try {
      devLog("Fetching post:", id);
      const response = await apiClient.getPost(id!);
      devLog("Post response:", response?.success ? "ok" : response?.error);

      if (response?.success && response.data) {
        const post = response.data;
        setFormData({
          title: post.title,
          content_markdown: post.content_markdown,
          status: post.status,
          cover_image: post.cover_image || "",
          canonical_url: post.canonical_url || "",
        });
        setTagList(Array.isArray(post.tags) ? post.tags : []);
      } else {
        toast.apiError(response?.error || "Failed to fetch post");
      }
    } catch (error) {
      devError("Error fetching post:", error);
      toast.apiError(`Failed to fetch post: ${(error as Error).message}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tagList.includes(tag)) {
      setTagList((prev) => [...prev, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagList((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleGenerateOutline = async () => {
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
  };

  const handleGenerateDraft = async () => {
    const outline = aiOutline.trim();
    if (!outline) {
      toast.validationError("Generate an outline first, or paste one above.");
      return;
    }
    setAiLoading("draft");
    try {
      const response = await apiClient.aiDraft(outline);
      if (response?.success && response.data?.draft) {
        const draft = response.data.draft;
        setFormData((prev) => ({
          ...prev,
          content_markdown: draft,
        }));
        toast.success("Draft generated", "Content added to the editor.");
      } else {
        toast.apiError(response?.error || "Failed to generate draft");
      }
    } catch (error) {
      toast.apiError((error as Error).message || "Failed to generate draft");
    } finally {
      setAiLoading("");
    }
  };

  const handleGenerateImage = async () => {
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
        toast.success("Image generated", "Preview below. Use as featured image or upload to attach to the post.");
      } else {
        toast.apiError(response?.error || "Failed to generate image");
      }
    } catch (error) {
      toast.apiError((error as Error).message || "Failed to generate image");
    } finally {
      setAiLoading("");
    }
  };

  const handleUseAsFeaturedImage = () => {
    if (!generatedImageDataUrl) return;
    setFormData((prev) => ({ ...prev, cover_image: generatedImageDataUrl }));
    toast.success("Featured image set", "You can save the post to keep it.");
  };

  const handleUploadAndAttach = async () => {
    if (!generatedImageDataUrl || !id) return;
    setUploadingCover(true);
    try {
      const response = await apiClient.uploadPostCover(id, generatedImageDataUrl);
      if (response?.success && response.data?.url) {
        setFormData((prev) => ({ ...prev, cover_image: response.data!.url }));
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
  };

  // Sync Quill text changes to formData
  useEffect(() => {
    if (quill) {
      const q = quill as {
        root: { innerHTML: string };
        on: (event: string, handler: () => void) => void;
        off: (event: string, handler: () => void) => void;
      };
      const handleTextChange = () => {
        const html = q.root.innerHTML;
        setFormData((prev) => {
          if (prev.content_markdown !== html) {
            return { ...prev, content_markdown: html };
          }
          return prev;
        });
      };

      q.on("text-change", handleTextChange);

      return () => {
        q.off("text-change", handleTextChange);
      };
    }
  }, [quill]);

  // Sync formData into Quill when: formData changed (e.g. AI draft) or we switched back to Edit (Quill was remounted empty)
  // AI returns markdown; Quill expects HTML — convert markdown → HTML for display
  const prevContentRef = useRef<string>(formData.content_markdown);
  useEffect(() => {
    if (!quill || activeTab !== "edit") return;
    const q = quill as {
      root: { innerHTML: string };
      clipboard: { dangerouslyPasteHTML: (html: string) => void };
    };
    const expectedHtml = contentForQuill(formData.content_markdown || "");
    const currentHtml = q.root.innerHTML;
    // Re-paste when formData changed or when Quill is empty (e.g. after toggle from Preview → Edit)
    if (currentHtml !== expectedHtml) {
      q.clipboard.dangerouslyPasteHTML(expectedHtml || "");
    }
    prevContentRef.current = formData.content_markdown;
  }, [quill, formData.content_markdown, activeTab]);

  // Source for preview: live from Quill when mounted, else formData (so preview is always current)
  const quillInstance = quill as { root: { innerHTML: string } } | null;
  const previewContent =
    (quillInstance?.root?.innerHTML?.trim() && quillInstance.root.innerHTML !== "<p><br></p>"
      ? quillInstance.root.innerHTML
      : null) ||
    formData.content_markdown ||
    "";

  const handleDownloadMdx = async () => {
    try {
      const postId = id;
      if (!postId) {
        toast.validationError(SYNC_LABEL.SAVE_FIRST_BEFORE_EXPORT);
        return;
      }
      await apiClient.downloadMdx(postId);
      toast.exportSuccess("MDX");
    } catch (e) {
      toast.exportError("MDX", (e as Error).message || "Could not export MDX");
    }
  };

  const handleSave = async (status = "draft") => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      toast.validationError(SYNC_LABEL.FILL_TITLE_AND_CONTENT);
      return;
    }

    setLoading(true);
    try {
      const postData = {
        ...formData,
        tags: tagList,
        status,
      };

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
            canonical_url: savedPost.canonical_url ?? prev.canonical_url,
          }));
        }
        if (id) {
          if (savedPost) onPostUpdate(savedPost);
          toast.saveSuccess(true);
        } else {
          if (savedPost) onPostCreate(savedPost);
          toast.saveSuccess(false);
        }

        if (status === "draft") {
          navigate("/");
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
  };

  const handlePublishToMedium = async () => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      toast.validationError(SYNC_LABEL.FILL_TITLE_AND_CONTENT);
      return;
    }

    setPublishing(true);
    try {
      let currentPostId = id;

      // If it's a new post, save it first
      if (!currentPostId) {
        devLog("Saving new post before publishing");
        const saveResponse = await apiClient.createPost({
          ...formData,
          tags: tagList,
          status: "draft",
        });

        if (!saveResponse?.success || !saveResponse.data) {
          throw new Error(saveResponse?.error || "Failed to save post");
        }

        currentPostId = saveResponse.data._id;
        onPostCreate(saveResponse.data);
      }

      // Publish to Medium
      devLog("🚀 Publishing to Medium...");
      const publishResponse = await apiClient.publish("medium", currentPostId!);

      if (publishResponse?.success) {
        if (publishResponse.data) onPostUpdate(publishResponse.data);
        toast.publishSuccess("Medium");
        navigate("/");
      } else {
        throw new Error(publishResponse?.error || "Failed to publish to Medium");
      }
    } catch (error) {
      devError("Error publishing to Medium:", error);
      toast.publishError("Medium", (error as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishToDevto = async () => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      toast.validationError(SYNC_LABEL.FILL_TITLE_AND_CONTENT);
      return;
    }

    setPublishing(true);
    try {
      let currentPostId = id;

      // If it's a new post, save it first
      if (!currentPostId) {
        devLog("Saving new post before publishing");
        const saveResponse = await apiClient.createPost({
          ...formData,
          tags: tagList,
          status: "draft",
        });

        if (!saveResponse?.success || !saveResponse.data) {
          throw new Error(saveResponse?.error || "Failed to save post");
        }

        currentPostId = saveResponse.data._id;
        onPostCreate(saveResponse.data);
      }

      // Publish to DEV.to
      devLog("Publishing to DEV.to");
      const publishResponse = await apiClient.publish("devto", currentPostId!);

      if (publishResponse?.success) {
        if (publishResponse.data) onPostUpdate(publishResponse.data);
        toast.publishSuccess("DEV.to");
        navigate("/");
      } else {
        throw new Error(publishResponse?.error || "Failed to publish to DEV.to");
      }
    } catch (error) {
      devError("Error publishing to DEV.to:", error);
      toast.publishError("DEV.to", (error as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishToWordpress = async () => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      toast.validationError(SYNC_LABEL.FILL_TITLE_AND_CONTENT);
      return;
    }

    setPublishing(true);
    try {
      let currentPostId = id;

      // If it's a new post, save it first
      if (!currentPostId) {
        devLog("Saving new post before publishing");
        const saveResponse = await apiClient.createPost({
          ...formData,
          tags: tagList,
          status: "draft",
        });

        if (!saveResponse?.success || !saveResponse.data) {
          throw new Error(saveResponse?.error || "Failed to save post");
        }

        currentPostId = saveResponse.data._id;
        onPostCreate(saveResponse.data);
      }

      // Publish to WordPress
      devLog("Publishing to WordPress");
      const publishResponse = await apiClient.publish("wordpress", currentPostId!);

      if (publishResponse?.success) {
        if (publishResponse.data) onPostUpdate(publishResponse.data);
        toast.publishSuccess("WordPress");
        navigate("/");
      } else {
        throw new Error(publishResponse?.error || "Failed to publish to WordPress");
      }
    } catch (error) {
      devError("Error publishing to WordPress:", error);
      toast.publishError("WordPress", (error as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishToAll = async () => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      toast.validationError(SYNC_LABEL.FILL_TITLE_AND_CONTENT);
      return;
    }

    setPublishing(true);
    try {
      let currentPostId = id;

      // If it's a new post, save it first
      if (!currentPostId) {
        devLog("Saving new post before publishing");
        const saveResponse = await apiClient.createPost({
          ...formData,
          tags: tagList,
          status: "draft",
        });

        if (!saveResponse?.success || !saveResponse.data) {
          throw new Error(saveResponse?.error || "Failed to save post");
        }

        currentPostId = saveResponse.data._id;
        onPostCreate(saveResponse.data);
      }

      // Publish to all platforms
      devLog("Publishing to all platforms");
      const publishResponse = await apiClient.publishAll(currentPostId!);

      if (publishResponse?.success) {
        if (publishResponse.data) onPostUpdate(publishResponse.data);
        toast.success("Published Everywhere!", "Post published to all platforms successfully!");
        navigate("/");
      } else {
        throw new Error(publishResponse?.error || "Failed to publish to all platforms");
      }
    } catch (error) {
      devError("Error publishing to all platforms:", error);
      toast.error("Publish Failed", `Failed to publish to all platforms: ${(error as Error).message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header: title, subtitle, Cancel + Save Post — match screenshot */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
              {id ? PAGE_TITLES.EDIT_POST : PAGE_TITLES.NEW_POST}
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm">{PAGE_DESCRIPTIONS.EDITOR_SUBTITLE}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 border-border bg-background"
              aria-label={SYNC_LABEL.CANCEL}
            >
              {SYNC_LABEL.CANCEL}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleSave("draft")}
              disabled={loading}
              className="flex items-center gap-2"
              aria-label={SYNC_LABEL.SAVE_POST}
            >
              <FiSave className="h-4 w-4" />
              {loading ? SYNC_LABEL.SAVING : SYNC_LABEL.SAVE_POST}
            </Button>
          </div>
        </div>

        {/* AI Assistant – SEO outline → draft */}
        <Card className="bg-white dark:bg-card shadow-md border border-border rounded-lg">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FiZap className="h-4 w-4 text-primary" />
              {SYNC_LABEL.AI_ASSISTANT}
            </div>
            <p className="text-xs text-muted-foreground">{SYNC_LABEL.AI_ASSISTANT_HINT}</p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[200px]">
                <label className="sr-only">{SYNC_LABEL.AI_KEYWORD_PLACEHOLDER}</label>
                <Input
                  value={aiKeyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiKeyword(e.target.value)}
                  placeholder={SYNC_LABEL.AI_KEYWORD_PLACEHOLDER}
                  className="w-full text-sm bg-background border-border"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateOutline}
                disabled={!!aiLoading}
                className="shrink-0"
              >
                {aiLoading === "outline" ? SYNC_LABEL.AI_LOADING : SYNC_LABEL.AI_GENERATE_OUTLINE}
              </Button>
            </div>
            {aiOutline && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{SYNC_LABEL.AI_OUTLINE_LABEL}</label>
                <textarea
                  value={aiOutline}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAiOutline(e.target.value)}
                  rows={20}
                  className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 font-mono"
                  placeholder="Outline will appear here…"
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleGenerateDraft}
                  disabled={!!aiLoading}
                  className="mt-2"
                >
                  {aiLoading === "draft" ? SYNC_LABEL.AI_LOADING : SYNC_LABEL.AI_GENERATE_DRAFT}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Single main card with Edit / Preview tabs — white card, subtle shadow */}
        <Card className="bg-white dark:bg-card shadow-md border border-border rounded-lg overflow-hidden">
          {/* Tab navigation — active: dark text + underline; inactive: muted */}
          <div className="border-b border-border bg-white dark:bg-card">
            <div className="flex gap-0 px-4 sm:px-6">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === "edit"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                aria-selected={activeTab === "edit"}
              >
                <FiEdit2 className="h-4 w-4 shrink-0" />
                {SYNC_LABEL.TAB_EDIT}
              </button>
              <button
                type="button"
                onClick={handleSwitchToPreview}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === "preview"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                aria-selected={activeTab === "preview"}
              >
                <FiEye className="h-4 w-4 shrink-0" />
                {SYNC_LABEL.TAB_PREVIEW}
              </button>
            </div>
          </div>

          <>
            <CardContent
              className={`p-4 sm:p-6 space-y-5 sm:space-y-6 bg-white dark:bg-card ${
                activeTab !== "edit" ? "hidden" : ""
              }`}
              aria-hidden={activeTab !== "edit"}
            >
              {/* Title */}
              <div>
                <label htmlFor="editor-title" className="block text-sm font-medium text-foreground mb-1.5">
                  {SYNC_LABEL.POST_TITLE}
                </label>
                <Input
                  id="editor-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={SYNC_LABEL.PLACEHOLDER_POST_TITLE}
                  className="w-full text-sm sm:text-base bg-background border-border rounded-md min-h-[44px] sm:min-h-0"
                />
                <p className="text-xs text-muted-foreground mt-1.5">{SYNC_LABEL.TITLE_SLUG_INFO}</p>
              </div>

              {/* Content (Markdown) - Rich Text Editor */}
              <div>
                <label id="editor-content-label" className="block text-sm font-medium text-foreground mb-1.5">
                  {SYNC_LABEL.CONTENT_MARKDOWN}
                </label>
                <div className="editor-wrapper border border-border rounded-md overflow-hidden bg-background">
                  <style>{`
                    .editor-wrapper .ql-toolbar {
                      padding: 6px 4px;
                      border-top-left-radius: 0.375rem;
                      border-top-right-radius: 0.375rem;
                      display: flex;
                      flex-wrap: wrap;
                      gap: 2px;
                    }
                    @media (min-width: 640px) {
                      .editor-wrapper .ql-toolbar {
                        padding: 8px;
                        gap: 0;
                      }
                    }
                    .editor-wrapper .ql-toolbar .ql-formats {
                      margin-right: 4px;
                    }
                    @media (min-width: 640px) {
                      .editor-wrapper .ql-toolbar .ql-formats {
                        margin-right: 8px;
                      }
                    }
                    .editor-wrapper .ql-toolbar button {
                      width: 28px;
                      height: 28px;
                      padding: 4px;
                    }
                    @media (min-width: 640px) {
                      .editor-wrapper .ql-toolbar button {
                        width: 32px;
                        height: 32px;
                        padding: 5px;
                      }
                    }
                    .editor-wrapper .ql-container {
                      min-height: 200px;
                      font-size: 14px;
                      border-bottom-left-radius: 0.375rem;
                      border-bottom-right-radius: 0.375rem;
                    }
                    @media (min-width: 640px) {
                      .editor-wrapper .ql-container {
                        min-height: 300px;
                        font-size: 16px;
                      }
                    }
                    .editor-wrapper .ql-editor {
                      min-height: 200px;
                      padding: 12px 15px;
                    }
                    @media (min-width: 640px) {
                      .editor-wrapper .ql-editor {
                        min-height: 300px;
                        padding: 15px;
                      }
                    }
                    .editor-wrapper .ql-editor.ql-blank::before {
                      font-size: 14px;
                      color: #9ca3af;
                    }
                    @media (min-width: 640px) {
                      .editor-wrapper .ql-editor.ql-blank::before {
                        font-size: 16px;
                      }
                    }
                  `}</style>
                  <div ref={quillRef} className="editor-wrapper" />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{SYNC_LABEL.CONTENT_MARKDOWN_HINT}</p>
              </div>

              {/* Tags: input + Add (dark button) + pills */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{SYNC_LABEL.TAGS_LABEL}</label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={SYNC_LABEL.ADD_TAG}
                    className="flex-1 text-sm sm:text-base bg-background border-border rounded-md"
                  />
                  <Button type="button" variant="default" onClick={handleAddTag} className="shrink-0">
                    {SYNC_LABEL.ADD}
                  </Button>
                </div>
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tagList.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-muted/80 text-foreground border border-border"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="p-0.5 rounded hover:bg-muted-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary"
                          aria-label={`Remove ${tag}`}
                        >
                          <FiX className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Featured Image URL */}
              <div>
                <label htmlFor="editor-cover-image" className="block text-sm font-medium text-foreground mb-1.5">
                  {SYNC_LABEL.FEATURED_IMAGE_URL}
                </label>
                <Input
                  id="editor-cover-image"
                  name="cover_image"
                  type="url"
                  value={formData.cover_image}
                  onChange={handleInputChange}
                  placeholder={SYNC_LABEL.PLACEHOLDER_COVER_IMAGE}
                  className="w-full text-sm sm:text-base bg-background border-border rounded-md min-h-[44px] sm:min-h-0"
                />
                {/* AI: Generate featured image from outline */}
                {aiOutline.trim() && (
                  <div className="mt-3 p-3 rounded-lg border border-border bg-muted/30 space-y-3">
                    <p className="text-xs text-muted-foreground">{SYNC_LABEL.FEATURED_IMAGE_GENERATE_HINT}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateImage}
                        disabled={!!aiLoading}
                        className="shrink-0"
                      >
                        <FiImage className="h-4 w-4 mr-1.5 inline" />
                        {aiLoading === "image" ? SYNC_LABEL.AI_IMAGE_LOADING : SYNC_LABEL.AI_GENERATE_IMAGE}
                      </Button>
                    </div>
                    {generatedImageDataUrl && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-foreground">{SYNC_LABEL.FEATURED_IMAGE_PREVIEW}</p>
                        <img
                          src={generatedImageDataUrl}
                          alt="Generated featured"
                          className="w-full max-w-md h-auto max-h-48 object-contain rounded-lg border border-border bg-background"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={handleUseAsFeaturedImage}>
                            {SYNC_LABEL.USE_AS_FEATURED_IMAGE}
                          </Button>
                          {id && (
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={handleUploadAndAttach}
                              disabled={uploadingCover}
                            >
                              <FiUpload className="h-4 w-4 mr-1.5 inline" />
                              {uploadingCover ? "Uploading…" : SYNC_LABEL.UPLOAD_AND_ATTACH}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            {/* Preview tab — always in DOM so Quill stays mounted when hidden */}
            <CardContent
              className={`p-4 sm:p-6 max-h-[calc(100vh-280px)] overflow-auto bg-white dark:bg-card ${
                activeTab !== "preview" ? "hidden" : ""
              }`}
              aria-hidden={activeTab !== "preview"}
            >
              <div className="prose prose-sm sm:prose-base max-w-none text-foreground">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">
                  {formData.title || SYNC_LABEL.UNTITLED_POST}
                </h1>
                {formData.canonical_url && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    <span className="font-medium">{SYNC_LABEL.CANONICAL_URL_LABEL}: </span>
                    <a
                      href={formData.canonical_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {formData.canonical_url}
                    </a>
                  </p>
                )}
                {formData.cover_image && (
                  <img
                    src={formData.cover_image}
                    alt="Cover"
                    className="w-full h-auto max-h-48 sm:max-h-64 object-cover rounded-lg mb-3 sm:mb-4"
                  />
                )}
                <div className="text-foreground leading-relaxed text-sm sm:text-base">
                  {isLikelyHtml(previewContent) ? (
                    <div
                      className="prose prose-sm sm:prose-base max-w-none [&_img]:rounded-md [&_pre]:rounded-lg"
                      dangerouslySetInnerHTML={{
                        __html: previewContent || SYNC_LABEL.NO_CONTENT_YET,
                      }}
                    />
                  ) : (
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          if (!inline && match) {
                            return (
                              <div className="overflow-x-auto -mx-3 sm:mx-0 my-3 sm:my-4">
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{
                                    borderRadius: 8,
                                    fontSize: "0.75rem",
                                    padding: "1rem",
                                    margin: 0,
                                    fontFamily:
                                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                    lineHeight: 1.6,
                                  }}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              </div>
                            );
                          }
                          return (
                            <code
                              className={`font-mono text-xs sm:text-sm bg-muted rounded px-1.5 sm:px-2 py-0.5 ${
                                className || ""
                              }`}
                              style={{
                                fontFamily:
                                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                              }}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        img({ src, alt }: { src?: string; alt?: string }) {
                          return <img src={src || ""} alt={alt || ""} className="w-full h-auto rounded-md" />;
                        },
                      }}
                    >
                      {previewContent || SYNC_LABEL.NO_CONTENT_YET}
                    </ReactMarkdown>
                  )}
                </div>
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4 sm:mt-6">
                    {tagList.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 sm:px-3 py-0.5 sm:py-1 bg-primary/15 text-primary text-xs sm:text-sm rounded-full font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </>
        </Card>

        {/* Action buttons: Export MDX, Publish (below card) */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadMdx}
            disabled={publishing}
            className="flex items-center gap-2"
          >
            <FiSave className="h-3.5 w-3.5" />
            {SYNC_LABEL.EXPORT_MDX}
          </Button>
          <Button size="sm" onClick={handlePublishToMedium} disabled={publishing} className="flex items-center gap-2">
            <FiSend className="h-3.5 w-3.5" />
            {publishing ? SYNC_LABEL.PUBLISHING : SYNC_LABEL.PUBLISH_TO_MEDIUM}
          </Button>
          <Button
            size="sm"
            onClick={handlePublishToDevto}
            disabled={publishing}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <FiGlobe className="h-3.5 w-3.5" />
            {publishing ? SYNC_LABEL.PUBLISHING : SYNC_LABEL.PUBLISH_TO_DEVTO}
          </Button>
          <Button
            size="sm"
            onClick={handlePublishToWordpress}
            disabled={publishing}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <FiGlobe className="h-3.5 w-3.5" />
            {publishing ? SYNC_LABEL.PUBLISHING : SYNC_LABEL.PUBLISH_TO_WORDPRESS}
          </Button>
          <Button
            size="sm"
            onClick={handlePublishToAll}
            disabled={publishing}
            variant="default"
            className="flex items-center gap-2"
          >
            <FiGlobe className="h-3.5 w-3.5" />
            {publishing ? SYNC_LABEL.PUBLISHING : SYNC_LABEL.PUBLISH_TO_ALL}
          </Button>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 p-3 sm:p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <FiArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}
    </div>
  );
};

export default Editor;
