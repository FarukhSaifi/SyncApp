"use client";

import dynamic from "next/dynamic";

import { usePostsContext } from "../dashboard-layout";

const Dashboard = dynamic(() => import("@views/Dashboard"), { ssr: false });

export default function DashboardPage() {
  const {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    page,
    pages,
    pageSize,
    totalPosts,
    filteredTotal,
    stats,
    onPostUpdate,
    onPostDelete,
    onRefresh,
    onLoadMore,
    onPageChange,
    onPageSizeChange,
    onStatusFilterChange,
    onSearchChange,
  } = usePostsContext();
  return (
    <Dashboard
      posts={posts}
      loading={loading}
      loadingMore={loadingMore}
      error={error}
      hasMore={hasMore}
      page={page}
      pages={pages}
      pageSize={pageSize}
      totalPosts={totalPosts}
      filteredTotal={filteredTotal}
      stats={stats}
      onPostUpdate={onPostUpdate}
      onPostDelete={onPostDelete}
      onRefresh={onRefresh}
      onLoadMore={onLoadMore}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onStatusFilterChange={onStatusFilterChange}
      onSearchChange={onSearchChange}
    />
  );
}
