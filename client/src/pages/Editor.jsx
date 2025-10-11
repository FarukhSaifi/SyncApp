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
        toast.validationError("Please save the post first before exporting MDX");
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
      toast.validationError("Please fill in both title and content");
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
      toast.validationError("Please fill in both title and content");
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
      toast.validationError("Please fill in both title and content");
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
      toast.validationError("Please fill in both title and content");
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
      toast.validationError("Please fill in both title and content");
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
      <div className=" mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{id ? "Edit Post" : "New Post"}</h1>
            <p className="text-gray-600 mt-2">{id ? "Update your blog post" : "Create a new blog post"}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="flex items-center space-x-2"
                aria-label="Back to Dashboard"
                title="Back to Dashboard"
              >
                <FiArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
            </div>

            <div className="flex items-center justify-end sm:justify-end w-full sm:w-auto space-x-2 mb-4 sm:mb-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                aria-label={showPreview ? "Hide Preview" : "Show Preview"}
                title={showPreview ? "Hide Preview" : "Show Preview"}
              >
                {showPreview ? <FiEyeOff className="h-4 w-4 sm:mr-2" /> : <FiEye className="h-4 w-4 sm:mr-2" />}
                <span className="hidden sm:inline">{showPreview ? "Hide Preview" : "Show Preview"}</span>
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
                <CardTitle>Post Title</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Post Title</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter your post title..."
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the post title here, it will create a slug for the post
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Rich Text Editor (React Quill) */}
            <Card className="shadow-sm border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Content</CardTitle>
                  <div className="text-sm text-muted-foreground">Rich text editor</div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ReactQuill
                  theme="snow"
                  value={formData.content_markdown}
                  onChange={handleQuillChange}
                  placeholder="Write your post content here..."
                />
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="shadow-sm border">
              <CardHeader>
                <CardTitle>Post Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <Input
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="webdev, programming, javascript, react..."
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tags help with discoverability on DEV.to and other platforms
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image URL (optional)</label>
                  <Input
                    name="cover_image"
                    value={formData.cover_image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canonical URL (optional)</label>
                  <Input
                    name="canonical_url"
                    value={formData.canonical_url}
                    onChange={handleInputChange}
                    placeholder="https://yourblog.com/post-url"
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">Original source URL for SEO purposes</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="shadow-sm border">
              <CardHeader>
                <CardTitle>Action Buttons</CardTitle>
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
                    {loading ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadMdx}
                    disabled={!id || loading}
                    className="w-full"
                  >
                    <FiSave className="h-4 w-4 mr-2" />
                    Export MDX
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePublishToMedium}
                    disabled={publishing}
                    className="w-full bg-black text-white hover:bg-black/90 border-0"
                  >
                    <FiSend className="h-4 w-4 mr-2" />
                    {publishing ? "Publishing..." : "Publish to Medium"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePublishToDevto}
                    disabled={publishing}
                    variant="secondary"
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 border-0"
                  >
                    <FiGlobe className="h-4 w-4 mr-2" />
                    {publishing ? "Publishing..." : "Publish to DEV.to"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePublishToWordpress}
                    disabled={publishing}
                    variant="secondary"
                    className="w-full bg-[#21759B] text-white hover:opacity-90 border-0"
                  >
                    <FiGlobe className="h-4 w-4 mr-2" />
                    {publishing ? "Publishing..." : "Publish to WordPress"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePublishToAll}
                    disabled={publishing}
                    variant="default"
                    className="w-full"
                  >
                    <FiGlobe className="h-4 w-4 mr-2" />
                    {publishing ? "Publishing..." : "Publish to All"}
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
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[70vh] overflow-auto">
                  <div className="prose prose-sm md:prose-base max-w-none">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{formData.title || "Untitled Post"}</h1>
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
                        {formData.content_markdown || "*No content yet...*"}
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
