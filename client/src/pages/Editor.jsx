import { ArrowLeft, Eye, EyeOff, Globe, Save, Send } from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";

const Editor = ({ onPostCreate, onPostUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      const response = await fetch(`/api/posts/${id}`);
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
      alert("Failed to fetch post");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (status = "draft") => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      alert("Please fill in both title and content");
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

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
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
          alert("Post updated successfully!");
        } else {
          onPostCreate(data.data);
          alert("Post created successfully!");
        }

        if (status === "draft") {
          navigate("/");
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Failed to save post");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToMedium = async () => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      alert("Please fill in both title and content");
      return;
    }

    setPublishing(true);
    try {
      // First save the post
      const saveResponse = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        },
        body: JSON.stringify({ postId: saveData.data.id }),
      });

      const publishData = await publishResponse.json();

      if (publishData.success) {
        onPostCreate({ ...saveData.data, status: "published" });
        alert("Post published to Medium successfully!");
        navigate("/");
      } else {
        throw new Error(publishData.error);
      }
    } catch (error) {
      console.error("Error publishing to Medium:", error);
      alert(`Failed to publish to Medium: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishToDevto = async () => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      alert("Please fill in both title and content");
      return;
    }

    setPublishing(true);
    try {
      // First save the post
      const saveResponse = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        },
        body: JSON.stringify({ postId: saveData.data.id }),
      });

      const publishData = await publishResponse.json();

      if (publishData.success) {
        onPostCreate({ ...saveData.data, status: "published" });
        alert("Post published to DEV.to successfully!");
        navigate("/");
      } else {
        throw new Error(publishData.error);
      }
    } catch (error) {
      console.error("Error publishing to DEV.to:", error);
      alert(`Failed to publish to DEV.to: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishToAll = async () => {
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      alert("Please fill in both title and content");
      return;
    }

    setPublishing(true);
    try {
      // First save the post
      const saveResponse = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        },
        body: JSON.stringify({ postId: saveData.data.id }),
      });

      const publishData = await publishResponse.json();

      if (publishData.success) {
        onPostCreate({ ...saveData.data, status: "published" });
        alert("Post published to all platforms successfully!");
        navigate("/");
      } else {
        throw new Error(publishData.error);
      }
    } catch (error) {
      console.error("Error publishing to all platforms:", error);
      alert(`Failed to publish to all platforms: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{id ? "Edit Post" : "New Post"}</h1>
            <p className="text-muted-foreground mt-2">
              {id ? "Update your blog post" : "Create a new blog post"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your post title..."
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Content (Markdown)
                </label>
                <Textarea
                  name="content_markdown"
                  value={formData.content_markdown}
                  onChange={handleInputChange}
                  placeholder="Write your post content in Markdown..."
                  className="w-full min-h-[400px] font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tags (comma-separated)
                </label>
                <Input
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="webdev, programming, javascript, react..."
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Tags help with discoverability on DEV.to and other platforms
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Canonical URL (optional)
                </label>
                <Input
                  name="canonical_url"
                  value={formData.canonical_url}
                  onChange={handleInputChange}
                  placeholder="https://yourblog.com/post-url"
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Original source URL for SEO purposes
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleSave("draft")} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Draft"}
              </Button>

              <Button onClick={handlePublishToMedium} disabled={publishing}>
                <Send className="h-4 w-4 mr-2" />
                {publishing ? "Publishing..." : "Publish to Medium"}
              </Button>

              <Button onClick={handlePublishToDevto} disabled={publishing} variant="secondary">
                <Globe className="h-4 w-4 mr-2" />
                {publishing ? "Publishing..." : "Publish to DEV.to"}
              </Button>

              <Button onClick={handlePublishToAll} disabled={publishing} variant="default">
                <Globe className="h-4 w-4 mr-2" />
                {publishing ? "Publishing..." : "Publish to All"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <h1>{formData.title || "Untitled Post"}</h1>
                  {formData.cover_image && (
                    <img
                      src={formData.cover_image}
                      alt="Cover"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <ReactMarkdown>
                    {formData.content_markdown || "*No content yet...*"}
                  </ReactMarkdown>
                  {formData.tags && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {formData.tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.length > 0)
                        .map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
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
  );
};

export default Editor;
