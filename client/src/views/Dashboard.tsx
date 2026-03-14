"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiEdit3, FiGlobe, FiPlus, FiRefreshCw, FiShare2 } from "react-icons/fi";
import Link from "next/link";

import Button from "@components/common/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/common/Card";
import ConfirmationModal from "@components/common/ConfirmationModal";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@components/common/Table";
import PostCard from "@components/dashboard/PostCard";
import PostRow from "@components/dashboard/PostRow";
import StatsCard from "@components/dashboard/StatsCard";

import { useToast } from "@hooks/useToast";

import { apiClient } from "@utils/apiClient";
import { devError, devLog } from "@utils/logger";

import { BUTTON_VARIANTS, COLOR_CLASSES, FILTER_STATUS_ALL, POST_STATUS, ROUTES, SYNC_LABEL } from "@constants";
import type { Post } from "@types";

interface DashboardProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  onPostUpdate: (post: Post) => void;
  onPostDelete: (id: string) => void;
  onRefresh: () => void;
}

interface DeleteConfirmState {
  isOpen: boolean;
  postId: string | null;
}

const Dashboard = ({ posts, loading, error, onPostDelete, onPostUpdate, onRefresh }: DashboardProps) => {
  const toast = useToast();
  const [filterStatus, setFilterStatus] = useState<string>(FILTER_STATUS_ALL);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ isOpen: false, postId: null });
  const [deleting, setDeleting] = useState<boolean>(false);

  // Show error if posts failed to load
  useEffect(() => {
    if (error) {
      toast.apiError(SYNC_LABEL.FAILED_TO_LOAD_POSTS(error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]); // Only depend on error, not toast (toast is stable)

  // Memoize delete click handler
  const handleDeleteClick = useCallback((id: string) => {
    setDeleteConfirm({ isOpen: true, postId: id });
  }, []);

  // Memoize delete confirmation handler
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.postId) return;

    setDeleting(true);
    try {
      devLog("Deleting post:", deleteConfirm.postId);
      const response = await apiClient.deletePost(deleteConfirm.postId);

      if (response?.success) {
        onPostDelete(deleteConfirm.postId);
        toast.deleteSuccess();
        setDeleteConfirm({ isOpen: false, postId: null });
      } else {
        toast.apiError(response?.error || SYNC_LABEL.FAILED_TO_DELETE_POST);
      }
    } catch (error) {
      devError("Error deleting post:", error);
      toast.apiError(`${SYNC_LABEL.FAILED_TO_DELETE_POST}: ${(error as Error).message}`);
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirm, onPostDelete, toast]);

  const filteredPosts = useMemo(() => {
    if (filterStatus === FILTER_STATUS_ALL) return posts;
    return posts.filter((p) => p.status === filterStatus);
  }, [posts, filterStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{SYNC_LABEL.LOADING_POSTS}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{SYNC_LABEL.DASHBOARD_TITLE}</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">{SYNC_LABEL.DASHBOARD_DESCRIPTION}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center justify-center space-x-2"
          >
            <FiRefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            {SYNC_LABEL.REFRESH}
          </Button>
          <Link href={ROUTES.EDITOR} className="w-full sm:w-auto">
            <Button className="flex items-center justify-center space-x-2 w-full sm:w-auto">
              <FiPlus className="h-4 w-4 mr-1" />
              {SYNC_LABEL.NEW_POST}
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className={`${COLOR_CLASSES.ALERT_BG.DESTRUCTIVE} ${COLOR_CLASSES.ALERT_TEXT.DESTRUCTIVE} px-4 py-3 rounded-md`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{SYNC_LABEL.FAILED_TO_LOAD_POSTS_TITLE}</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <FiRefreshCw className="h-4 w-4 mr-1" />
              {SYNC_LABEL.RETRY}
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatsCard
          title={SYNC_LABEL.TOTAL_POSTS}
          value={posts.length}
          icon={() => <FiGlobe className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />}
          isActive={filterStatus === FILTER_STATUS_ALL}
          onClick={() => setFilterStatus(FILTER_STATUS_ALL)}
        />
        <StatsCard
          title={SYNC_LABEL.PUBLISHED}
          value={posts.filter((post) => post.status === POST_STATUS.PUBLISHED).length}
          icon={() => <FiCheckCircle className={`h-3 w-3 sm:h-4 sm:w-4 ${COLOR_CLASSES.ICON_COLOR.POSITIVE}`} />}
          isActive={filterStatus === POST_STATUS.PUBLISHED}
          onClick={() => setFilterStatus(POST_STATUS.PUBLISHED)}
        />
        <StatsCard
          title={SYNC_LABEL.DRAFTS}
          value={posts.filter((post) => post.status === POST_STATUS.DRAFT).length}
          icon={() => <FiEdit3 className={`h-3 w-3 sm:h-4 sm:w-4 ${COLOR_CLASSES.ICON_COLOR.WARNING}`} />}
          isActive={filterStatus === POST_STATUS.DRAFT}
          onClick={() => setFilterStatus(POST_STATUS.DRAFT)}
        />
        <StatsCard
          title={SYNC_LABEL.PLATFORMS}
          value={
            posts.filter(
              (post) =>
                post.platform_status &&
                (post.platform_status.medium?.published || post.platform_status.devto?.published),
            ).length
          }
          icon={() => <FiShare2 className={`h-3 w-3 sm:h-4 sm:w-4 ${COLOR_CLASSES.ICON_COLOR.PRIMARY}`} />}
          isActive={false}
          onClick={() => {}}
        />
      </div>

      {/* Posts Table */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{SYNC_LABEL.ALL_POSTS}</CardTitle>
              <CardDescription>
                {filteredPosts.length === 0 ? SYNC_LABEL.NO_POSTS_YET : SYNC_LABEL.SHOWING_POSTS(filteredPosts.length)}
              </CardDescription>
            </div>
            {filterStatus !== FILTER_STATUS_ALL && (
              <button
                onClick={() => setFilterStatus(FILTER_STATUS_ALL)}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {SYNC_LABEL.CLEAR_FILTER}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-8">
              <FiGlobe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{SYNC_LABEL.NO_POSTS_TITLE}</h3>
              <p className="text-muted-foreground mb-4">{SYNC_LABEL.NO_POSTS_DESCRIPTION}</p>
              <Link href={ROUTES.EDITOR}>
                <Button>{SYNC_LABEL.CREATE_FIRST_POST}</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDelete={handleDeleteClick}
                    onUpdate={onPostUpdate}
                    toast={toast}
                  />
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{SYNC_LABEL.TABLE_TITLE}</TableHead>
                      <TableHead>{SYNC_LABEL.TABLE_STATUS}</TableHead>
                      <TableHead>{SYNC_LABEL.TABLE_SEO}</TableHead>
                      <TableHead>{SYNC_LABEL.TABLE_TAGS}</TableHead>
                      <TableHead>{SYNC_LABEL.TABLE_PUBLISHED_ON}</TableHead>
                      <TableHead>{SYNC_LABEL.TABLE_CREATED}</TableHead>
                      <TableHead className="text-right">{SYNC_LABEL.TABLE_ACTIONS}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.map((post) => (
                      <PostRow
                        key={post._id}
                        post={post}
                        onDelete={handleDeleteClick}
                        onUpdate={onPostUpdate}
                        toast={toast}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, postId: null })}
        onConfirm={handleDeleteConfirm}
        title={SYNC_LABEL.DELETE_POST}
        message={SYNC_LABEL.DELETE_POST_CONFIRM}
        confirmText={SYNC_LABEL.DELETE}
        cancelText={SYNC_LABEL.CANCEL}
        variant={BUTTON_VARIANTS.DESTRUCTIVE}
        isLoading={deleting}
        size="md"
      />
    </div>
  );
};

export default Dashboard;
