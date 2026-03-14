"use client";

import dynamic from "next/dynamic";
import { usePostsContext } from "../dashboard-layout";

const Dashboard = dynamic(() => import("@views/Dashboard"), { ssr: false });

export default function DashboardPage() {
  const { posts, loading, error, onPostUpdate, onPostDelete, onRefresh } = usePostsContext();
  return (
    <Dashboard
      posts={posts}
      loading={loading}
      error={error}
      onPostUpdate={onPostUpdate}
      onPostDelete={onPostDelete}
      onRefresh={onRefresh}
    />
  );
}
