"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PostCard from "@components/dashboard/PostCard";
import PostRow from "@components/dashboard/PostRow";
import StatsCard from "@components/dashboard/StatsCard";
import DataTable from "@components/data-table/DataTable";
import {
  BUTTON_VARIANTS,
  COLOR_CLASSES,
  DASHBOARD_LAYOUT,
  DATA_TABLE,
  FILTER_STATUS_ALL,
  FILTER_STATUS_SCHEDULED,
  POST_STATUS,
  POST_TABLE_COLUMNS,
  ROUTES,
  SYNC_LABEL,
} from "@constants";
import { useDataTable } from "@hooks/useDataTable";
import { useDebounce } from "@hooks/useDebounce";
import { useToast } from "@hooks/useToast";
import type { DashboardDeleteConfirmState, DashboardProps, DataTableColumn, Post } from "@types";
import { apiClient } from "@utils/apiClient";
import { devError, devLog } from "@utils/logger";
import { getSeoScorecard } from "@utils/seoScorecard";
import Link from "next/link";
import { FiCheckCircle, FiClock, FiEdit3, FiGlobe, FiPlus, FiRefreshCw } from "react-icons/fi";

import Button from "@components/common/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/common/Card";
import ConfirmationModal from "@components/common/ConfirmationModal";
import Skeleton from "@components/common/Skeleton";

const Dashboard = ({
  posts,
  loading,
  error,
  page,
  pages,
  pageSize = DATA_TABLE.DEFAULT_PAGE_SIZE,
  totalPosts = 0,
  filteredTotal = 0,
  stats,
  onPostDelete,
  onPostUpdate: _onPostUpdate,
  onRefresh,
  onPageChange,
  onPageSizeChange,
  onStatusFilterChange,
  onSearchChange,
}: DashboardProps) => {
  const toast = useToast();
  const [filterStatus, setFilterStatus] = useState<string>(FILTER_STATUS_ALL);
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, DATA_TABLE.SEARCH_DEBOUNCE_MS);
  const [deleteConfirm, setDeleteConfirm] = useState<DashboardDeleteConfirmState>({ isOpen: false, postId: null });
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (error) {
      toast.apiError(SYNC_LABEL.FAILED_TO_LOAD_POSTS(error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const skipInitialSearchRef = useRef(true);
  useEffect(() => {
    if (skipInitialSearchRef.current) {
      skipInitialSearchRef.current = false;
      return;
    }
    onSearchChange?.(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const handleStatusFilter = useCallback(
    (status: string) => {
      setFilterStatus(status);
      onStatusFilterChange?.(status);
    },
    [onStatusFilterChange],
  );

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteConfirm({ isOpen: true, postId: id });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.postId) {
      return;
    }

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
    } catch (err) {
      devError("Error deleting post:", err);
      toast.apiError(`${SYNC_LABEL.FAILED_TO_DELETE_POST}: ${(err as Error).message}`);
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirm, onPostDelete, toast]);

  const postSortFns = useMemo(
    () => ({
      [POST_TABLE_COLUMNS.TITLE]: (a: Post, b: Post) => a.title.localeCompare(b.title),
      [POST_TABLE_COLUMNS.STATUS]: (a: Post, b: Post) => a.status.localeCompare(b.status),
      [POST_TABLE_COLUMNS.SEO]: (a: Post, b: Post) => getSeoScorecard(a).score - getSeoScorecard(b).score,
      [POST_TABLE_COLUMNS.CREATED]: (a: Post, b: Post) => {
        const aDate = (a as Post & { created_at?: string }).created_at || a.createdAt || "";
        const bDate = (b as Post & { created_at?: string }).created_at || b.createdAt || "";
        return String(aDate).localeCompare(String(bDate));
      },
      [POST_TABLE_COLUMNS.UPDATED]: (a: Post, b: Post) => {
        const aDate = (a as Post & { updated_at?: string }).updated_at || a.updatedAt || "";
        const bDate = (b as Post & { updated_at?: string }).updated_at || b.updatedAt || "";
        return String(aDate).localeCompare(String(bDate));
      },
    }),
    [],
  );

  const { sort, setSort, visibleRows } = useDataTable<Post>({
    rows: posts,
    sortFns: postSortFns,
  });

  const postColumns = useMemo<DataTableColumn<Post>[]>(
    () => [
      { id: POST_TABLE_COLUMNS.TITLE, header: SYNC_LABEL.TABLE_TITLE, sortable: true },
      { id: POST_TABLE_COLUMNS.STATUS, header: SYNC_LABEL.TABLE_STATUS, sortable: true },
      { id: POST_TABLE_COLUMNS.SEO, header: SYNC_LABEL.TABLE_SEO, sortable: true },
      { id: POST_TABLE_COLUMNS.TAGS, header: SYNC_LABEL.TABLE_TAGS },
      { id: POST_TABLE_COLUMNS.PUBLISHED_ON, header: SYNC_LABEL.TABLE_PUBLISHED_ON },
      { id: POST_TABLE_COLUMNS.CREATED, header: SYNC_LABEL.TABLE_CREATED, sortable: true },
      { id: POST_TABLE_COLUMNS.UPDATED, header: SYNC_LABEL.TABLE_UPDATED, sortable: true },
      { id: POST_TABLE_COLUMNS.ACTIONS, header: SYNC_LABEL.TABLE_ACTIONS, className: DATA_TABLE.ACTIONS_CELL },
    ],
    [],
  );

  const emptyState = (
    <div className="py-8 text-center">
      <FiGlobe className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-medium text-foreground">{SYNC_LABEL.NO_POSTS_TITLE}</h3>
      <p className="mb-4 text-muted-foreground">
        {searchInput.trim() || filterStatus !== FILTER_STATUS_ALL
          ? SYNC_LABEL.DATA_TABLE_NO_RESULTS
          : SYNC_LABEL.NO_POSTS_DESCRIPTION}
      </p>
      {!searchInput.trim() && filterStatus === FILTER_STATUS_ALL ? (
        <Link href={ROUTES.EDITOR} prefetch={false}>
          <Button>{SYNC_LABEL.CREATE_FIRST_POST}</Button>
        </Link>
      ) : null}
    </div>
  );

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <div>
            <Skeleton className="h-8 w-48 sm:h-9" />
            <Skeleton className="mt-2 h-4 w-72 sm:w-96" />
          </div>
          <div className="flex gap-2 sm:space-x-3">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>

        <div className={DASHBOARD_LAYOUT.STATS_ROW_CLASS}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={DASHBOARD_LAYOUT.STATS_ITEM_CLASS}>
              <div className={DASHBOARD_LAYOUT.STATS_SKELETON_CARD_CLASS}>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16 sm:h-4 sm:w-20" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <Skeleton className="h-7 w-12 sm:h-8 sm:w-16" />
              </div>
            </div>
          ))}
        </div>

        <Card className="border shadow-sm">
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:hidden">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
            <div className="hidden space-y-2 md:block">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{SYNC_LABEL.DASHBOARD_TITLE}</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">{SYNC_LABEL.DASHBOARD_DESCRIPTION}</p>
        </div>
        <div className="flex flex-row items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="flex flex-1 items-center justify-center space-x-2 sm:flex-initial"
          >
            <FiRefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {SYNC_LABEL.REFRESH}
          </Button>
          <Link href={ROUTES.EDITOR} prefetch={false} className="flex-1 sm:w-auto sm:flex-initial">
            <Button className="flex w-full items-center justify-center space-x-2">
              <FiPlus className="mr-1 h-4 w-4" />
              {SYNC_LABEL.NEW_POST}
            </Button>
          </Link>
        </div>
      </div>

      {error ? (
        <div
          className={`${COLOR_CLASSES.ALERT_BG.DESTRUCTIVE} ${COLOR_CLASSES.ALERT_TEXT.DESTRUCTIVE} rounded-md px-4 py-3`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{SYNC_LABEL.FAILED_TO_LOAD_POSTS_TITLE}</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <FiRefreshCw className="mr-1 h-4 w-4" />
              {SYNC_LABEL.RETRY}
            </Button>
          </div>
        </div>
      ) : null}

      <div className={DASHBOARD_LAYOUT.STATS_ROW_CLASS}>
        <div className={DASHBOARD_LAYOUT.STATS_ITEM_CLASS}>
          <StatsCard
            title={SYNC_LABEL.TOTAL_POSTS}
            value={stats?.total ?? totalPosts}
            icon={() => <FiGlobe className="h-3 w-3 text-primary sm:h-4 sm:w-4" />}
            isActive={filterStatus === FILTER_STATUS_ALL}
            onClick={() => handleStatusFilter(FILTER_STATUS_ALL)}
          />
        </div>
        <div className={DASHBOARD_LAYOUT.STATS_ITEM_CLASS}>
          <StatsCard
            title={SYNC_LABEL.PUBLISHED}
            value={stats?.published ?? 0}
            icon={() => <FiCheckCircle className={`h-3 w-3 sm:h-4 sm:w-4 ${COLOR_CLASSES.ICON_COLOR.POSITIVE}`} />}
            isActive={filterStatus === POST_STATUS.PUBLISHED}
            onClick={() => handleStatusFilter(POST_STATUS.PUBLISHED)}
          />
        </div>
        <div className={DASHBOARD_LAYOUT.STATS_ITEM_CLASS}>
          <StatsCard
            title={SYNC_LABEL.DRAFTS}
            value={stats?.drafts ?? 0}
            icon={() => <FiEdit3 className={`h-3 w-3 sm:h-4 sm:w-4 ${COLOR_CLASSES.ICON_COLOR.WARNING}`} />}
            isActive={filterStatus === POST_STATUS.DRAFT}
            onClick={() => handleStatusFilter(POST_STATUS.DRAFT)}
          />
        </div>
        <div className={DASHBOARD_LAYOUT.STATS_ITEM_CLASS}>
          <StatsCard
            title={SYNC_LABEL.SCHEDULED}
            value={stats?.scheduled ?? 0}
            icon={() => <FiClock className={`h-3 w-3 sm:h-4 sm:w-4 ${COLOR_CLASSES.ICON_COLOR.PRIMARY}`} />}
            isActive={filterStatus === FILTER_STATUS_SCHEDULED}
            onClick={() => handleStatusFilter(FILTER_STATUS_SCHEDULED)}
          />
        </div>
      </div>

      <Card className={DASHBOARD_LAYOUT.TABLE_CARD_CLASS}>
        <CardHeader className={DASHBOARD_LAYOUT.TABLE_CARD_HEADER_CLASS}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className={DASHBOARD_LAYOUT.TABLE_CARD_TITLE_CLASS}>{SYNC_LABEL.ALL_POSTS}</CardTitle>
              <CardDescription>
                {visibleRows.length === 0
                  ? SYNC_LABEL.NO_POSTS_YET
                  : SYNC_LABEL.SHOWING_POSTS(filteredTotal || visibleRows.length)}
              </CardDescription>
            </div>
            {filterStatus !== FILTER_STATUS_ALL ? (
              <button
                type="button"
                onClick={() => handleStatusFilter(FILTER_STATUS_ALL)}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {SYNC_LABEL.CLEAR_FILTER}
              </button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className={DASHBOARD_LAYOUT.TABLE_CARD_CONTENT_CLASS}>
          <DataTable<Post>
            embedded
            columns={postColumns}
            rows={visibleRows}
            getRowId={(row) => row._id}
            renderRow={(row) => <PostRow post={row} onDelete={handleDeleteClick} />}
            mobileRow={(row) => <PostCard post={row} onDelete={handleDeleteClick} />}
            search={{
              value: searchInput,
              onChange: setSearchInput,
              placeholder: SYNC_LABEL.DATA_TABLE_SEARCH_POSTS,
            }}
            pageSize={
              onPageSizeChange
                ? {
                    value: pageSize,
                    onChange: onPageSizeChange,
                  }
                : undefined
            }
            sort={{
              key: sort.key,
              direction: sort.direction,
              onChange: setSort,
            }}
            loading={loading}
            empty={emptyState}
            pagination={{
              page,
              pages,
              onPrev: () => onPageChange(Math.max(1, page - 1)),
              onNext: () => onPageChange(Math.min(pages, page + 1)),
              onPageChange,
            }}
          />
        </CardContent>
      </Card>

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
