import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiEdit3, FiGlobe, FiPlus, FiRefreshCw, FiShare2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import PostRow from "../components/dashboard/PostRow";
import StatsCard from "../components/dashboard/StatsCard";
import Button from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "../components/ui/Table";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]); // Only depend on error, not toast (toast is stable)

  // Memoize delete handler to prevent unnecessary re-renders
  const handleDelete = useCallback(
    async (id) => {
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
    },
    [onPostDelete, toast]
  );

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
            <FiRefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link to="/editor">
            <Button className="flex items-center space-x-2">
              <FiPlus className="h-4 w-4 mr-1" />
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
              <FiRefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Posts"
          value={posts.length}
          icon={() => <FiGlobe className="h-4 w-4 text-blue-500" />}
          isActive={filterStatus === "all"}
          onClick={() => setFilterStatus("all")}
        />
        <StatsCard
          title="Published"
          value={posts.filter((post) => post.status === "published").length}
          icon={() => <FiCheckCircle className="h-4 w-4 text-green-500" />}
          isActive={filterStatus === "published"}
          onClick={() => setFilterStatus("published")}
        />
        <StatsCard
          title="Drafts"
          value={posts.filter((post) => post.status === "draft").length}
          icon={() => <FiEdit3 className="h-4 w-4 text-yellow-500" />}
          isActive={filterStatus === "draft"}
          onClick={() => setFilterStatus("draft")}
        />
        <StatsCard
          title="Platforms"
          value={
            posts.filter(
              (post) =>
                post.platform_status &&
                (post.platform_status.medium?.published || post.platform_status.devto?.published)
            ).length
          }
          icon={() => <FiShare2 className="h-4 w-4 text-purple-500" />}
          isActive={false}
          onClick={() => {}}
        />
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
                  <PostRow
                    key={post.id || post._id}
                    post={post}
                    onDelete={handleDelete}
                    onUpdate={onPostUpdate}
                    toast={toast}
                  />
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
