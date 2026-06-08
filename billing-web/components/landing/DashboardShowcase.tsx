"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const metrics = [
  {
    label: "Total Revenue",
    value: "₹12,48,560",
    change: "+18.2%",
    trend: "up",
    icon: DollarSign,
    color: "from-emerald-500 to-teal-500",
  },
  {
    label: "Products Sold",
    value: "8,240",
    change: "+12.5%",
    trend: "up",
    icon: Package,
    color: "from-blue-500 to-indigo-500",
  },
  {
    label: "New Customers",
    value: "1,240",
    change: "+24.1%",
    trend: "up",
    icon: Users,
    color: "from-violet-500 to-purple-500",
  },
  {
    label: "Profit Margin",
    value: "32.4%",
    change: "+3.8%",
    trend: "up",
    icon: TrendingUp,
    color: "from-orange-500 to-amber-500",
  },
];

const chartData = [
  { month: "Jan", sales: 65, revenue: 42000 },
  { month: "Feb", sales: 78, revenue: 51000 },
  { month: "Mar", sales: 52, revenue: 34000 },
  { month: "Apr", sales: 91, revenue: 59000 },
  { month: "May", sales: 85, revenue: 55000 },
  { month: "Jun", sales: 95, revenue: 62000 },
  { month: "Jul", sales: 72, revenue: 47000 },
  { month: "Aug", sales: 88, revenue: 57000 },
  { month: "Sep", sales: 96, revenue: 63000 },
  { month: "Oct", sales: 110, revenue: 72000 },
  { month: "Nov", sales: 105, revenue: 68000 },
  { month: "Dec", sales: 120, revenue: 79000 },
];

const topProducts = [
  { name: "iPhone 15 Pro Max", sold: 245, revenue: "₹2.4L" },
  { name: "Samsung Galaxy S24", sold: 198, revenue: "₹1.6L" },
  { name: "MacBook Air M3", sold: 87, revenue: "₹1.1L" },
  { name: "Sony WH-1000XM5", sold: 156, revenue: "₹52K" },
  { name: "iPad Pro 12.9", sold: 112, revenue: "₹98K" },
];

export default function DashboardShowcase() {
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue));

  return (
    <section className="relative bg-gradient-to-b from-white to-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl"
          >
            Your business at a glance
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-gray-500"
          >
            Real-time analytics and insights to help you make smarter business decisions every day.
          </motion.p>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="relative mt-16"
        >
          {/* Glow */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 blur-2xl" />

          <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 bg-white shadow-2xl shadow-gray-900/10">
            {/* Window bar */}
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-6 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <div className="ml-4 text-xs font-medium text-gray-400">Revenue Analytics — BillingApp</div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Metric cards */}
              <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {metrics.map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${metric.color} shadow-sm`}>
                        <metric.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                        {metric.trend === "up" ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {metric.change}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                    <div className="mt-1 text-xs text-gray-500">{metric.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Chart and top products */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Revenue chart */}
                <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Revenue Overview</h3>
                    <div className="flex gap-2">
                      {["Week", "Month", "Year"].map((period) => (
                        <button
                          key={period}
                          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                            period === "Year"
                              ? "bg-indigo-100 text-indigo-700"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bar chart */}
                  <div className="flex items-end gap-1.5" style={{ height: "180px" }}>
                    {chartData.map((d, i) => (
                      <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                        <motion.div
                          initial={{ height: 0 }}
                          whileInView={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
                          className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-violet-400"
                        />
                        <span className="text-[10px] text-gray-400">{d.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top products */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">Top Products</h3>
                  <div className="space-y-3">
                    {topProducts.map((product, i) => (
                      <motion.div
                        key={product.name}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-bold text-indigo-600">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-xs font-medium text-gray-800">{product.name}</div>
                          <div className="text-[10px] text-gray-400">{product.sold} units</div>
                        </div>
                        <div className="text-xs font-semibold text-gray-600">{product.revenue}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
