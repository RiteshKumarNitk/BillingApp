"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function RevenueChart({ data, label = "Revenue", color = "#4F46E5" }: { data: any[]; label?: string; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#6B7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6B7280" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
          formatter={(value: any) => [`₹${value}`, label]}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={color}
          strokeWidth={3}
          dot={{ r: 4, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: color, stroke: "#C7D2FE", strokeWidth: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
