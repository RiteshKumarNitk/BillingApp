"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const PIE_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#0EA5E9", "#8B5CF6"];

export function PeakHoursChart({ data }: { data: { label: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} interval={2} />
        <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fill: "#6B7280" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, "Revenue"]}
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
        />
        <Bar dataKey="total" fill="#6366F1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PaymentMethodChart({ data }: { data: { method: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={90} label={(d) => d.method}>
          {data.map((_, index) => (
            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, "Total"]}
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function FullCategoryChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
        <XAxis type="number" tickFormatter={(value) => `₹${value}`} tick={{ fill: "#6B7280" }} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} width={110} />
        <Tooltip
          formatter={(value) => `₹${value}`}
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
        />
        <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
