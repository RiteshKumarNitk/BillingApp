"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function SuperAdminChart({ growthData }: { growthData: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={growthData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
        />
        <Bar dataKey="count" fill="url(#colorGrowth)" radius={[4, 4, 0, 0]} name="New Tenants" />
        <defs>
          <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0.2} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
