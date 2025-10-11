import React, { useEffect, useMemo, useState } from "react";
import { FiEdit, FiGlobe, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { STATUS_CONFIG } from "../constants";
import { useToast } from "../hooks/useToast";
import { apiClient } from "../utils/apiClient";

const Dashboard = ({ posts, loading, error, onPostDelete, onPostUpdate, onRefresh }) => {
  const toast = useToast();
  const [filterStatus, setFilterStatus] = useState("all");

  // Show error if posts failed to load
  useEffect(() => {
    if (error) {
      toast.apiError(`Failed to load posts: ${error}`);
    }
  }, [error, toast]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        console.log("🗑️ Deleting post:", id);
        const response = await apiClient.deletePost(id);

        if (response?.success) {
          onPostDelete(id);
          toast.deleteSuccess();
        } else {
          toast.apiError(response?.error || "Failed to delete post");
        }
      } catch (error) {
        console.error("❌ Error deleting post:", error);
        toast.apiError(`Failed to delete post: ${error.message}`);
      }
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>{config.label}</span>;
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

    if (post.platform_status?.wordpress?.published) {
      platforms.push(
        <a
          key="wordpress"
          href={post.platform_status.wordpress.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
        >
          <span className="text-blue-500">●</span>
          <span>WordPress</span>
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

  const filteredPosts = useMemo(() => {
    if (filterStatus === "all") return posts;
    return posts.filter((p) => p.status === filterStatus);
  }, [posts, filterStatus]);

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
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={onRefresh} disabled={loading} className="flex items-center space-x-2">
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link to="/editor">
            <Button className="flex items-center space-x-2">
              <FiPlus className="h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Failed to load posts</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer ${filterStatus === "all" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilterStatus("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FiGlobe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer ${filterStatus === "published" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilterStatus("published")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <FiGlobe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.filter((post) => post.status === "published").length}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer ${filterStatus === "draft" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilterStatus("draft")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FiGlobe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.filter((post) => post.status === "draft").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platforms</CardTitle>
            <FiGlobe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                posts.filter(
                  (post) =>
                    post.platform_status &&
                    (post.platform_status.medium?.published || post.platform_status.devto?.published)
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts Table */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Posts</CardTitle>
              <CardDescription>
                {filteredPosts.length === 0
                  ? "No posts yet. Create your first post to get started!"
                  : `Showing ${filteredPosts.length} post${filteredPosts.length === 1 ? "" : "s"}`}
              </CardDescription>
            </div>
            {filterStatus !== "all" && (
              <button
                onClick={() => setFilterStatus("all")}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-8">
              <FiGlobe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                {filteredPosts.map((post) => (
                  <TableRow key={post.id || post._id}>
                    <TableCell className="font-medium">
                      <div className="max-w-xs">
                        <div className="truncate">{post.title}</div>
                        {post.cover_image && (
                          <div className="text-xs text-muted-foreground mt-1">📷 Has cover image</div>
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
                          <span className="text-muted-foreground text-xs">+{post.tags.length - 3} more</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPlatformStatus(post)}</TableCell>
                    <TableCell>{formatDate(post.created_at || post.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/editor/${post.id || post._id}`}>
                          <Button variant="outline" size="sm">
                            <FiEdit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(post.id || post._id)}>
                          <FiTrash2 className="h-4 w-4" />
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
