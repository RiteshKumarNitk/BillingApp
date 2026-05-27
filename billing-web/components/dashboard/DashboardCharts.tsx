"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardCharts({
  salesData,
  categoryData,
}: {
  salesData: any[];
  categoryData: any[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeRange = searchParams.get("timeRange") || "7d";

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("timeRange", e.target.value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Sales Trend Chart */}
      <section className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Sales Trend</h2>
          <select
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
        <div className="h-72">
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ formatter: (value) => `₹${value}`, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => `₹${value}`}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="total" fill="url(#colorTotal)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No sales data available for this period.
            </div>
          )}
        </div>
      </section>

      {/* Category Distribution Chart */}
      <section className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
        <h2 className="mb-6 text-xl font-bold text-gray-800">Sales by Category</h2>
        <div className="h-72">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tick={{ formatter: (value) => `₹${value}`, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => `₹${value}`}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="value" fill="url(#colorCategory)" radius={[0, 4, 4, 0]} barSize={30} />
                <defs>
                  <linearGradient id="colorCategory" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No category data available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
