import { Edit, Globe, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";

const Dashboard = ({ posts, onPostDelete, onPostUpdate }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const response = await fetch(`/api/posts/${id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
          onPostDelete(id);
          alert("Post deleted successfully!");
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("Failed to delete post");
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      published: { label: "Published", className: "bg-green-100 text-green-800" },
      archived: { label: "Archived", className: "bg-yellow-100 text-yellow-800" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPlatformStatus = (post) => {
    const platforms = [];

    if (post.platform_status?.medium?.published) {
      platforms.push(
        <a
          key="medium"
          href={post.platform_status.medium.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
        >
          <span className="text-orange-500">●</span>
          <span>Medium</span>
        </a>
      );
    }

    if (post.platform_status?.devto?.published) {
      platforms.push(
        <a
          key="devto"
          href={post.platform_status.devto.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
        >
          <span className="text-purple-500">●</span>
          <span>DEV.to</span>
        </a>
      );
    }

    if (platforms.length === 0) {
      return <span className="text-muted-foreground">Not published</span>;
    }

    return <div className="flex flex-wrap gap-2">{platforms}</div>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your blog posts and publishing status</p>
        </div>
        <Link to="/editor">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter((post) => post.status === "published").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter((post) => post.status === "draft").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platforms</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                posts.filter(
                  (post) =>
                    post.platform_status &&
                    (post.platform_status.medium?.published ||
                      post.platform_status.devto?.published)
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
          <CardDescription>
            {posts.length === 0
              ? "No posts yet. Create your first post to get started!"
              : `Showing ${posts.length} post${posts.length === 1 ? "" : "s"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Start writing your first blog post to get published on Medium and DEV.to
              </p>
              <Link to="/editor">
                <Button>Create Your First Post</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Published On</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id || post._id}>
                    <TableCell className="font-medium">
                      <div className="max-w-xs">
                        <div className="truncate">{post.title}</div>
                        {post.cover_image && (
                          <div className="text-xs text-muted-foreground mt-1">
                            📷 Has cover image
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-32">
                        {post.tags && post.tags.length > 0 ? (
                          post.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full truncate"
                              title={tag}
                            >
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No tags</span>
                        )}
                        {post.tags && post.tags.length > 3 && (
                          <span className="text-muted-foreground text-xs">
                            +{post.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPlatformStatus(post)}</TableCell>
                    <TableCell>{formatDate(post.created_at || post.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/editor/${post.id || post._id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(post.id || post._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
