import React, { useEffect, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiBold,
  FiCode,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiHash,
  FiImage,
  FiItalic,
  FiLink,
  FiList,
  // FiQuote,
  FiRotateCcw,
  FiRotateCw,
  FiSave,
  FiSend,
  FiUnderline,
} from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useToaster } from "../components/ui/Toaster";

const Editor = ({ onPostCreate, onPostUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const { success, error: showError } = useToaster();
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
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/posts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setFormData({
          title: data.data.title,
          content_markdown: data.data.content_markdown,
          status: data.data.status,
          tags: data.data.tags ? data.data.tags.join(", ") : "",
          cover_image: data.data.cover_image || "",
          canonical_url: data.data.canonical_url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      showError("Error", "Failed to fetch post");
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

  const handleEditorInput = () => {
    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        content_markdown: editorRef.current.innerHTML,
      }));
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
      showError("Validation Error", "Please fill in both title and content");
      return;
    }

    setLoading(true);
    try {
      const url = id ? `/api/posts/${id}` : "/api/posts";
      const method = id ? "PUT" : "POST";

      // Process tags from comma-separated string to array
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          tags,
          status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (id) {
          onPostUpdate(data.data);
          success("Success", "Post updated successfully!");
        } else {
          onPostCreate(data.data);
          success("Success", "Post created successfully!");
        }

        if (status === "draft") {
          navigate("/");
        }
      } else {
        showError("Error", data.error || "Failed to save post");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      showError("Error", "Failed to save post");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToMedium = async () => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      showError("Validation Error", "Please fill in both title and content");
      return;
    }

    setPublishing(true);
    try {
      // First save the post
      const token = localStorage.getItem("token");
      const saveResponse = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
          status: "draft",
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        throw new Error(saveData.error);
      }

      // Then publish to Medium
      const publishResponse = await fetch("/api/publish/medium", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: saveData.data.id }),
      });

      const publishData = await publishResponse.json();

      if (publishData.success) {
        onPostCreate({ ...saveData.data, status: "published" });
        success("Success", "Post published to Medium successfully!");
        navigate("/");
      } else {
        throw new Error(publishData.error);
      }
    } catch (error) {
      console.error("Error publishing to Medium:", error);
      showError("Error", `Failed to publish to Medium: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishToDevto = async () => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      showError("Validation Error", "Please fill in both title and content");
      return;
    }

    setPublishing(true);
    try {
      // First save the post
      const token = localStorage.getItem("token");
      const saveResponse = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
          status: "draft",
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        throw new Error(saveData.error);
      }

      // Then publish to DEV.to
      const publishResponse = await fetch("/api/publish/devto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: saveData.data.id }),
      });

      const publishData = await publishResponse.json();

      if (publishData.success) {
        onPostCreate({ ...saveData.data, status: "published" });
        success("Success", "Post published to DEV.to successfully!");
        navigate("/");
      } else {
        throw new Error(publishData.error);
      }
    } catch (error) {
      console.error("Error publishing to DEV.to:", error);
      showError("Error", `Failed to publish to DEV.to: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishToWordpress = async () => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      showError("Validation Error", "Please fill in both title and content");
      return;
    }

    setPublishing(true);
    try {
      // First save the post
      const token = localStorage.getItem("token");
      const saveResponse = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
          status: "draft",
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        throw new Error(saveData.error);
      }

      // Then publish to WordPress
      const publishResponse = await fetch("/api/publish/wordpress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: saveData.data.id }),
      });

      const publishData = await publishResponse.json();

      if (publishData.success) {
        onPostCreate({ ...saveData.data, status: "published" });
        success("Success", "Post published to WordPress successfully!");
        navigate("/");
      } else {
        throw new Error(publishData.error);
      }
    } catch (error) {
      console.error("Error publishing to WordPress:", error);
      showError("Error", `Failed to publish to WordPress: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishToAll = async () => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      showError("Validation Error", "Please fill in both title and content");
      return;
    }

    setPublishing(true);
    try {
      // First save the post
      const token = localStorage.getItem("token");
      const saveResponse = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
          status: "draft",
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        throw new Error(saveData.error);
      }

      // Then publish to all platforms
      const publishResponse = await fetch("/api/publish/all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: saveData.data.id }),
      });

      const publishData = await publishResponse.json();

      if (publishData.success) {
        onPostCreate({ ...saveData.data, status: "published" });
        success("Success", "Post published to all platforms successfully!");
        navigate("/");
      } else {
        throw new Error(publishData.error);
      }
    } catch (error) {
      console.error("Error publishing to all platforms:", error);
      showError("Error", `Failed to publish to all platforms: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="flex items-center space-x-2"
              >
                <FiArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {id ? "Edit Post" : "New Post"}
                </h1>
                <p className="text-gray-600 mt-2">
                  {id ? "Update your blog post" : "Create a new blog post"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? (
                  <FiEyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <FiEye className="h-4 w-4 mr-2" />
                )}
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Input */}
            <Card className="shadow-sm border-0">
              <CardContent className="p-6">
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your post title..."
                  className="w-full text-2xl font-bold border-0 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-0 py-2"
                />
              </CardContent>
            </Card>

            {/* Rich Text Editor */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Content</CardTitle>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => execCommand("undo")}
                      className="h-8 w-8 p-0"
                      title="Undo"
                    >
                      <FiRotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => execCommand("redo")}
                      className="h-8 w-8 p-0"
                      title="Redo"
                    >
                      <FiRotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Toolbar */}
              <div className="border-b border-gray-200 px-6 pb-3">
                <div className="flex items-center space-x-1 flex-wrap gap-2">
                  {/* Text Formatting */}
                  <div className="flex items-center space-x-1 border-r border-gray-200 pr-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => execCommand("bold")}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Bold"
                    >
                      <FiBold className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => execCommand("italic")}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Italic"
                    >
                      <FiItalic className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => execCommand("underline")}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Underline"
                    >
                      <FiUnderline className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Headings */}
                  <div className="flex items-center space-x-1 border-r border-gray-200 pr-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown("# ")}
                      className="h-8 px-2 text-sm hover:bg-gray-100"
                      title="Heading 1"
                    >
                      H1
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown("## ")}
                      className="h-8 px-2 text-sm hover:bg-gray-100"
                      title="Heading 2"
                    >
                      H2
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown("### ")}
                      className="h-8 px-2 text-sm hover:bg-gray-100"
                      title="Heading 3"
                    >
                      H3
                    </Button>
                  </div>

                  {/* Lists */}
                  <div className="flex items-center space-x-1 border-r border-gray-200 pr-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown("- ")}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Bullet List"
                    >
                      <FiList className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown("1. ")}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Numbered List"
                    >
                      <FiHash className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Special Elements */}
                  <div className="flex items-center space-x-1 border-r border-gray-200 pr-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown("> ")}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Quote"
                    >
                      {/* <FiQuote className="h-4 w-4" /> */}
                      ""
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown("`code`")}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Inline Code"
                    >
                      <FiCode className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown("```\n\n```")}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Code Block"
                    >
                      <FiCode className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Links and Images */}
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown("[link text](url)")}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Insert Link"
                    >
                      <FiLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown("![alt text](image-url)")}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Insert Image"
                    >
                      <FiImage className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Editor Area */}
              <CardContent className="p-0">
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  onKeyDown={handleEditorKeyDown}
                  className="min-h-[500px] p-6 focus:outline-none focus:ring-0 text-gray-800 leading-relaxed prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: formData.content_markdown }}
                  style={{
                    fontFamily:
                      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: "16px",
                    lineHeight: "1.7",
                  }}
                />
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>Post Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image URL (optional)
                  </label>
                  <Input
                    name="cover_image"
                    value={formData.cover_image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Canonical URL (optional)
                  </label>
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
            <Card className="shadow-sm border-0">
              <CardFooter className="flex flex-wrap gap-3 justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleSave("draft")} disabled={loading}>
                    <FiSave className="h-4 w-4 mr-2" />
                    {loading ? "Saving..." : "Save Draft"}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handlePublishToMedium} disabled={publishing}>
                    <FiSend className="h-4 w-4 mr-2" />
                    {publishing ? "Publishing..." : "Publish to Medium"}
                  </Button>

                  <Button onClick={handlePublishToDevto} disabled={publishing} variant="secondary">
                    <FiGlobe className="h-4 w-4 mr-2" />
                    {publishing ? "Publishing..." : "Publish to DEV.to"}
                  </Button>

                  <Button
                    onClick={handlePublishToWordpress}
                    disabled={publishing}
                    variant="secondary"
                  >
                    <FiGlobe className="h-4 w-4 mr-2" />
                    {publishing ? "Publishing..." : "Publish to WordPress"}
                  </Button>

                  <Button onClick={handlePublishToAll} disabled={publishing} variant="default">
                    <FiGlobe className="h-4 w-4 mr-2" />
                    {publishing ? "Publishing..." : "Publish to All"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="space-y-6">
              <Card className="shadow-sm border-0 sticky top-6">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                      {formData.title || "Untitled Post"}
                    </h1>
                    {formData.cover_image && (
                      <img
                        src={formData.cover_image}
                        alt="Cover"
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="text-gray-700 leading-relaxed">
                      <ReactMarkdown>
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
