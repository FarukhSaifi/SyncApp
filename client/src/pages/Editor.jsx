import React, { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiEye, FiEyeOff, FiGlobe, FiSave, FiSend } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate, useParams } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Button from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { SYNC_LABEL } from "../constants";
import { useToast } from "../hooks/useToast";
import { apiClient } from "../utils/apiClient";

const Editor = ({ onPostCreate, onPostUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content_markdown: "",
    status: "draft",
    tags: "",
    cover_image: "",
    canonical_url: "",
  });

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      console.log("🔄 Fetching post:", id);
      const response = await apiClient.getPost(id);
      console.log("📄 Post response:", response);

      if (response?.success) {
        setFormData({
          title: response.data.title,
          content_markdown: response.data.content_markdown,
          status: response.data.status,
          tags: response.data.tags ? response.data.tags.join(", ") : "",
          cover_image: response.data.cover_image || "",
          canonical_url: response.data.canonical_url || "",
        });
      } else {
        toast.apiError(response?.error || "Failed to fetch post");
      }
    } catch (error) {
      console.error("❌ Error fetching post:", error);
      toast.apiError(`Failed to fetch post: ${error.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Rich text editor functions
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertText = (text) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
    }
    editorRef.current?.focus();
  };

  const insertMarkdown = (markdown) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(markdown));
    }
    editorRef.current?.focus();
  };

  const handleQuillChange = (html) => {
    setFormData((prev) => ({ ...prev, content_markdown: html }));
  };

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
      toast.exportError("MDX", e.message || "Could not export MDX");
    }
  };

  const handleEditorKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      insertText("  "); // Insert 2 spaces for tab
    }
  };

  const handleSave = async (status = "draft") => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      toast.validationError(SYNC_LABEL.FILL_TITLE_AND_CONTENT);
      return;
    }

    setLoading(true);
    try {
      // Process tags from comma-separated string to array
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const postData = {
        ...formData,
        tags,
        status,
      };

      console.log("🔄 Saving post:", id ? "update" : "create", postData);
      let response;

      if (id) {
        response = await apiClient.updatePost(id, postData);
      } else {
        response = await apiClient.createPost(postData);
      }

      console.log("💾 Save response:", response);

      if (response?.success) {
        if (id) {
          onPostUpdate(response.data);
          toast.saveSuccess(true);
        } else {
          onPostCreate(response.data);
          toast.saveSuccess(false);
        }

        if (status === "draft") {
          navigate("/");
        }
      } else {
        toast.apiError(response?.error || "Failed to save post");
      }
    } catch (error) {
      console.error("❌ Error saving post:", error);
      toast.apiError(`Failed to save post: ${error.message}`);
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
        const tags = formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);

        console.log("🔄 Saving new post before publishing...");
        const saveResponse = await apiClient.createPost({
          ...formData,
          tags,
          status: "draft",
        });

        if (!saveResponse?.success) {
          throw new Error(saveResponse?.error || "Failed to save post");
        }

        currentPostId = saveResponse.data.id;
        onPostCreate(saveResponse.data);
      }

      // Publish to Medium
      console.log("🚀 Publishing to Medium...");
      const publishResponse = await apiClient.publish("medium", currentPostId);

      if (publishResponse?.success) {
        onPostUpdate(publishResponse.data);
        toast.publishSuccess("Medium");
        navigate("/");
      } else {
        throw new Error(publishResponse?.error || "Failed to publish to Medium");
      }
    } catch (error) {
      console.error("❌ Error publishing to Medium:", error);
      toast.publishError("Medium", error.message);
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
        const tags = formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);

        console.log("🔄 Saving new post before publishing...");
        const saveResponse = await apiClient.createPost({
          ...formData,
          tags,
          status: "draft",
        });

        if (!saveResponse?.success) {
          throw new Error(saveResponse?.error || "Failed to save post");
        }

        currentPostId = saveResponse.data.id;
        onPostCreate(saveResponse.data);
      }

      // Publish to DEV.to
      console.log("🚀 Publishing to DEV.to...");
      const publishResponse = await apiClient.publish("devto", currentPostId);

      if (publishResponse?.success) {
        onPostUpdate(publishResponse.data);
        toast.publishSuccess("DEV.to");
        navigate("/");
      } else {
        throw new Error(publishResponse?.error || "Failed to publish to DEV.to");
      }
    } catch (error) {
      console.error("❌ Error publishing to DEV.to:", error);
      toast.publishError("DEV.to", error.message);
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
        const tags = formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);

        console.log("🔄 Saving new post before publishing...");
        const saveResponse = await apiClient.createPost({
          ...formData,
          tags,
          status: "draft",
        });

        if (!saveResponse?.success) {
          throw new Error(saveResponse?.error || "Failed to save post");
        }

        currentPostId = saveResponse.data.id;
        onPostCreate(saveResponse.data);
      }

      // Publish to WordPress
      console.log("🚀 Publishing to WordPress...");
      const publishResponse = await apiClient.publish("wordpress", currentPostId);

      if (publishResponse?.success) {
        onPostUpdate(publishResponse.data);
        toast.publishSuccess("WordPress");
        navigate("/");
      } else {
        throw new Error(publishResponse?.error || "Failed to publish to WordPress");
      }
    } catch (error) {
      console.error("❌ Error publishing to WordPress:", error);
      toast.publishError("WordPress", error.message);
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
        const tags = formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);

        console.log("🔄 Saving new post before publishing...");
        const saveResponse = await apiClient.createPost({
          ...formData,
          tags,
          status: "draft",
        });

        if (!saveResponse?.success) {
          throw new Error(saveResponse?.error || "Failed to save post");
        }

        currentPostId = saveResponse.data.id;
        onPostCreate(saveResponse.data);
      }

      // Publish to all platforms
      console.log("🚀 Publishing to all platforms...");
      const publishResponse = await apiClient.publishAll(currentPostId);

      if (publishResponse?.success) {
        onPostUpdate(publishResponse.data);
        toast.success("Published Everywhere!", "Post published to all platforms successfully!");
        navigate("/");
      } else {
        throw new Error(publishResponse?.error || "Failed to publish to all platforms");
      }
    } catch (error) {
      console.error("❌ Error publishing to all platforms:", error);
      toast.error("Publish Failed", `Failed to publish to all platforms: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {id ? SYNC_LABEL.EDIT_POST : SYNC_LABEL.NEW_POST}
              </h1>
              <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm">
                {id ? SYNC_LABEL.UPDATE_POST_DESCRIPTION : SYNC_LABEL.CREATE_POST_DESCRIPTION}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="flex items-center space-x-1.5 sm:space-x-2"
                aria-label={SYNC_LABEL.BACK_TO_DASHBOARD}
                title={SYNC_LABEL.BACK_TO_DASHBOARD}
              >
                <FiArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{SYNC_LABEL.BACK_TO_DASHBOARD}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-1.5 sm:space-x-2"
                aria-label={showPreview ? SYNC_LABEL.HIDE_PREVIEW : SYNC_LABEL.SHOW_PREVIEW}
                title={showPreview ? SYNC_LABEL.HIDE_PREVIEW : SYNC_LABEL.SHOW_PREVIEW}
              >
                {showPreview ? (
                  <FiEyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <FiEye className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
                <span className="text-xs sm:text-sm">
                  {showPreview ? SYNC_LABEL.HIDE_PREVIEW : SYNC_LABEL.SHOW_PREVIEW}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Title Input */}
            <Card className="shadow-sm border">
              <CardHeader>
                <CardTitle>{SYNC_LABEL.POST_TITLE}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{SYNC_LABEL.POST_TITLE}</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder={SYNC_LABEL.PLACEHOLDER_POST_TITLE}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">{SYNC_LABEL.TITLE_SLUG_INFO}</p>
                </div>
              </CardContent>
            </Card>

            {/* Rich Text Editor (React Quill) */}
            <Card className="shadow-sm border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>{SYNC_LABEL.CONTENT}</CardTitle>
                  <div className="text-sm text-muted-foreground">{SYNC_LABEL.RICH_TEXT_EDITOR}</div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ReactQuill
                  theme="snow"
                  value={formData.content_markdown}
                  onChange={handleQuillChange}
                  placeholder={SYNC_LABEL.PLACEHOLDER_POST_CONTENT}
                />
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="shadow-sm border">
              <CardHeader>
                <CardTitle>{SYNC_LABEL.POST_METADATA}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <Input
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder={SYNC_LABEL.PLACEHOLDER_TAGS}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">{SYNC_LABEL.TAGS_HELP}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image URL (optional)</label>
                  <Input
                    name="cover_image"
                    value={formData.cover_image}
                    onChange={handleInputChange}
                    placeholder={SYNC_LABEL.PLACEHOLDER_COVER_IMAGE}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canonical URL (optional)</label>
                  <Input
                    name="canonical_url"
                    value={formData.canonical_url}
                    onChange={handleInputChange}
                    placeholder={SYNC_LABEL.PLACEHOLDER_CANONICAL_URL}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">{SYNC_LABEL.CANONICAL_URL_HELP}</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="shadow-sm border">
              <CardHeader>
                <CardTitle>{SYNC_LABEL.ACTION_BUTTONS}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSave("draft")}
                    disabled={loading}
                    className="w-full"
                  >
                    <FiSave className="h-4 w-4 mr-2" />
                    {loading ? SYNC_LABEL.SAVING : SYNC_LABEL.SAVE_DRAFT}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadMdx}
                    disabled={publishing}
                    className="w-full"
                  >
                    <FiSave className="h-4 w-4 mr-2" />
                    {SYNC_LABEL.EXPORT_MDX}
                  </Button>
                  <Button size="sm" onClick={handlePublishToMedium} disabled={publishing} className="w-full">
                    <FiSend className="h-4 w-4 mr-2" />
                    {publishing ? SYNC_LABEL.PUBLISHING : SYNC_LABEL.PUBLISH_TO_MEDIUM}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePublishToDevto}
                    disabled={publishing}
                    variant="secondary"
                    className="w-full"
                  >
                    <FiGlobe className="h-4 w-4 mr-2" />
                    {publishing ? SYNC_LABEL.PUBLISHING : SYNC_LABEL.PUBLISH_TO_DEVTO}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePublishToWordpress}
                    disabled={publishing}
                    variant="secondary"
                    className="w-full "
                  >
                    <FiGlobe className="h-4 w-4 mr-2" />
                    {publishing ? SYNC_LABEL.PUBLISHING : SYNC_LABEL.PUBLISH_TO_WORDPRESS}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePublishToAll}
                    disabled={publishing}
                    variant="default"
                    className="w-full"
                  >
                    <FiGlobe className="h-4 w-4 mr-2" />
                    {publishing ? SYNC_LABEL.PUBLISHING : SYNC_LABEL.PUBLISH_TO_ALL}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="space-y-6">
              <Card className="shadow-sm border lg:sticky lg:top-6">
                <CardHeader>
                  <CardTitle>{SYNC_LABEL.PREVIEW}</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[100vh] overflow-auto">
                  <div className="prose prose-sm md:prose-base max-w-none">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                      {formData.title || SYNC_LABEL.UNTITLED_POST}
                    </h1>
                    {formData.cover_image && (
                      <img
                        src={formData.cover_image}
                        alt="Cover"
                        className="w-full h-auto max-h-64 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="text-gray-700 leading-relaxed">
                      <ReactMarkdown
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            if (!inline && match) {
                              return (
                                <div className="overflow-x-auto">
                                  <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                      borderRadius: 8,
                                      fontSize: "0.85rem",
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
                                className={`font-mono text-xs sm:text-sm bg-gray-100 rounded px-1 py-0.5 ${
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
                          img({ src, alt }) {
                            return (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={src || ""} alt={alt || ""} className="w-full h-auto rounded-md" />
                            );
                          },
                        }}
                      >
                        {formData.content_markdown || SYNC_LABEL.NO_CONTENT_YET}
                      </ReactMarkdown>
                    </div>
                    {formData.tags && (
                      <div className="flex flex-wrap gap-2 mt-6">
                        {formData.tags
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag.length > 0)
                          .map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
