"use client";

import dynamic from "next/dynamic";

import { usePostsContext } from "../dashboard-layout";

const Dashboard = dynamic(() => import("@views/Dashboard"), { ssr: false });

export default function DashboardPage() {
  const {
    posts,
    loading,
    error,
    page,
    pages,
    pageSize,
    totalPosts,
    filteredTotal,
    stats,
    onPostDelete,
    onRefresh,
    onPageChange,
    onPageSizeChange,
    onStatusFilterChange,
    onSearchChange,
  } = usePostsContext();
  return (
    <Dashboard
      posts={posts}
      loading={loading}
      error={error}
      page={page}
      pages={pages}
      pageSize={pageSize}
      totalPosts={totalPosts}
      filteredTotal={filteredTotal}
      stats={stats}
      onPostDelete={onPostDelete}
      onRefresh={onRefresh}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onStatusFilterChange={onStatusFilterChange}
      onSearchChange={onSearchChange}
    />
  );
}
