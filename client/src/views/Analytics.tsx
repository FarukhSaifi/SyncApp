"use client";
import { useEffect, useState } from "react";

import { ANALYTICS_COLORS, ANALYTICS_LABELS, APP_CONFIG } from "@constants";
import { useToast } from "@hooks/useToast";
import type { AnalyticsStats } from "@types";
import { apiClient } from "@utils/apiClient";
import dayjs from "dayjs";
import { FiActivity, FiGlobe, FiPieChart, FiTrendingUp } from "react-icons/fi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/common/Card";
import Skeleton from "@components/common/Skeleton";

const Analytics = () => {
  const [data, setData] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getAnalyticsStats();
      if (res?.success) {
        setData(res.data ?? null);
      } else {
        toast.apiError(res?.error || ANALYTICS_LABELS.LOAD_FAILED);
      }
    } catch {
      toast.apiError(ANALYTICS_LABELS.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40 sm:h-9" />
          <Skeleton className="h-4 w-72 sm:w-96 mt-2" />
        </div>

        {/* Summary Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </CardDescription>
                <CardTitle className="text-2xl mt-1">
                  <Skeleton className="h-7 w-12" />
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Chart Skeleton */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-64 mt-1" />
            </CardHeader>
            <CardContent className="h-[300px] flex items-end justify-between px-6 pb-6 gap-2">
              {Array.from({ length: 12 }, (_, i) => i).map((n) => (
                <Skeleton
                  key={`activity-skeleton-${n}`}
                  className="w-full bg-muted/40 rounded-t"
                  style={{
                    height: `${10 + Math.sin(n) * 40 + Math.cos(n) * 30}%`,
                  }}
                />
              ))}
            </CardContent>
          </Card>

          {/* Status Distribution Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-52 mt-1" />
            </CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center">
              <Skeleton className="h-32 w-32 rounded-full border-16 border-muted/20 animate-pulse" />
            </CardContent>
          </Card>

          {/* Platform Distribution Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-52 mt-1" />
            </CardHeader>
            <CardContent className="h-[250px] flex flex-col justify-center gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-4 w-full rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const statusData = [
    { name: ANALYTICS_LABELS.CHART_DRAFTS, value: data.summary.totalDrafts },
    { name: ANALYTICS_LABELS.CHART_PUBLISHED, value: data.summary.totalPublished },
  ];

  const platformData = [
    { name: ANALYTICS_LABELS.PLATFORM_MEDIUM, count: data.platformStats.medium },
    { name: ANALYTICS_LABELS.PLATFORM_DEVTO, count: data.platformStats.devto },
    { name: ANALYTICS_LABELS.PLATFORM_WORDPRESS, count: data.platformStats.wordpress },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{ANALYTICS_LABELS.PAGE_TITLE}</h1>
        <p className="text-muted-foreground mt-2">{ANALYTICS_LABELS.PAGE_DESCRIPTION}</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <FiGlobe className="h-3.5 w-3.5" /> {ANALYTICS_LABELS.CHART_TOTAL_POSTS}
            </CardDescription>
            <CardTitle className="text-2xl">{data.summary.totalPosts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <FiActivity className="h-3.5 w-3.5" /> {ANALYTICS_LABELS.CHART_PUBLISHED}
            </CardDescription>
            <CardTitle className="text-2xl">{data.summary.totalPublished}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <FiTrendingUp className="h-3.5 w-3.5" /> {ANALYTICS_LABELS.PUBLISH_RATE}
            </CardDescription>
            <CardTitle className="text-2xl">{data.summary.publishRate.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <FiPieChart className="h-3.5 w-3.5" /> {ANALYTICS_LABELS.ACTIVE_PLATFORMS}
            </CardDescription>
            <CardTitle className="text-2xl">
              {Object.values(data.platformStats).filter((v) => (v as number) > 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>{ANALYTICS_LABELS.DAILY_ACTIVITY_TITLE}</CardTitle>
            <CardDescription>{ANALYTICS_LABELS.DAILY_ACTIVITY_DESC}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickFormatter={(str) => dayjs(str).format(APP_CONFIG.DATE_FORMAT)}
                />
                <YAxis fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Line type="monotone" dataKey="posts" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="published" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{ANALYTICS_LABELS.STATUS_DISTRIBUTION_TITLE}</CardTitle>
            <CardDescription>{ANALYTICS_LABELS.STATUS_DISTRIBUTION_DESC}</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={ANALYTICS_COLORS[index % ANALYTICS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{ANALYTICS_LABELS.PLATFORM_DISTRIBUTION_TITLE}</CardTitle>
            <CardDescription>{ANALYTICS_LABELS.PLATFORM_DISTRIBUTION_DESC}</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={platformData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
