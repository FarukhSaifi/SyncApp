"use client";

import dynamic from "next/dynamic";

const Analytics = dynamic(() => import("@views/Analytics"), { ssr: false });

export default function AnalyticsPage() {
  return <Analytics />;
}
