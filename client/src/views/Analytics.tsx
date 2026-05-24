"use client";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { FiTrendingUp, FiActivity, FiGlobe, FiPieChart } from "react-icons/fi";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/common/Card";
import { apiClient } from "@utils/apiClient";
import { APP_CONFIG } from "@constants";
import { useToast } from "@hooks/useToast";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const Analytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getAnalyticsStats();
      if (res?.success) {
        setData(res.data);
      } else {
        toast.apiError(res?.error || "Failed to load analytics");
      }
    } catch {
      toast.apiError("Error loading analytics");
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  const statusData = [
    { name: "Drafts", value: data.summary.totalDrafts },
    { name: "Published", value: data.summary.totalPublished },
  ];

  const platformData = [
    { name: "Medium", count: data.platformStats.medium },
    { name: "Dev.to", count: data.platformStats.devto },
    { name: "WordPress", count: data.platformStats.wordpress },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-2">Insights into your publishing activity and performance.</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <FiGlobe className="h-3.5 w-3.5" /> Total Posts
            </CardDescription>
            <CardTitle className="text-2xl">{data.summary.totalPosts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <FiActivity className="h-3.5 w-3.5" /> Published
            </CardDescription>
            <CardTitle className="text-2xl">{data.summary.totalPublished}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <FiTrendingUp className="h-3.5 w-3.5" /> Publish Rate
            </CardDescription>
            <CardTitle className="text-2xl">{data.summary.publishRate.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <FiPieChart className="h-3.5 w-3.5" /> Active Platforms
            </CardDescription>
            <CardTitle className="text-2xl">
              {Object.values(data.platformStats).filter(v => (v as number) > 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Activity (30 Days)</CardTitle>
            <CardDescription>Number of posts created and published over time.</CardDescription>
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
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Ratio of drafts to published content.</CardDescription>
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Destinations for your published content.</CardDescription>
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
