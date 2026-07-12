"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function CustomerGrowthChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
          formatter={(value: any) => [value, "New Customers"]}
        />
        <Bar dataKey="count" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ComparisonBarChart({
  thisMonth,
  lastMonth,
  format = 'number',
}: {
  thisMonth: number;
  lastMonth: number;
  format?: 'currency' | 'number';
}) {
  const formatValue = (v: number) => (format === 'currency' ? `₹${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : v.toLocaleString());
  const data = [
    { label: 'Last Month', value: lastMonth },
    { label: 'This Month', value: thisMonth },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={formatValue} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} width={80} />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
          formatter={(value: any) => [formatValue(Number(value)), ""]}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={index === 1 ? "#6366F1" : "#C7D2FE"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
