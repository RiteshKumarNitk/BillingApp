"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Receipt,
  BarChart3,
  ShoppingCart,
  Package,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 pb-20 pt-40">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-200/40 to-violet-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-200/30 to-cyan-200/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-100/20 to-purple-100/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-sm font-medium text-indigo-700 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            The all-in-one platform for modern cafes
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Run Your Entire Cafe
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              From One Platform
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl"
          >
            Website, QR table ordering, kitchen queue, and POS billing with GST built in — everything a cafe needs, in one place.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/auth/register"
              className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:brightness-110"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button className="group flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                <Play className="h-3 w-3 fill-gray-600" />
              </div>
              Watch Demo
            </button>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              3 months free trial
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </div>
          </motion.div>
        </div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-500/20 blur-2xl" />

          {/* Main dashboard card */}
          <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 bg-white shadow-2xl shadow-gray-900/10">
            {/* Window controls */}
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-6 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <div className="ml-4 flex-1 text-center text-xs font-medium text-gray-400">
                CafeOS Dashboard
              </div>
            </div>

            {/* Dashboard content */}
            <div className="bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8">
              {/* Top stats row */}
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { label: "Today's Revenue", value: "₹18,240", change: "+12.5%", icon: Receipt, color: "from-emerald-500 to-teal-500" },
                  { label: "Menu Items", value: "42", change: "+3.2%", icon: Package, color: "from-blue-500 to-indigo-500" },
                  { label: "Orders", value: "126", change: "+8.1%", icon: ShoppingCart, color: "from-violet-500 to-purple-500" },
                  { label: "Customers", value: "890", change: "+5.4%", icon: BarChart3, color: "from-orange-500 to-amber-500" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                    className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-sm`}>
                        <stat.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">{stat.change}</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="mt-1 text-xs text-gray-500">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Chart area placeholder */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Revenue Overview</h3>
                  <div className="flex gap-2">
                    {["Day", "Week", "Month"].map((period) => (
                      <button
                        key={period}
                        className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                          period === "Month"
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Simulated chart bars */}
                <div className="flex items-end gap-2" style={{ height: "120px" }}>
                  {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.8, delay: 0.8 + i * 0.05 }}
                        className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-violet-400"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-xs text-gray-400">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating mobile preview */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotate: 5 }}
            animate={{ opacity: 1, x: 0, rotate: 3 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="absolute -bottom-6 -right-4 hidden w-48 rounded-3xl border border-gray-200/60 bg-white shadow-2xl shadow-gray-900/10 sm:block lg:-right-8 lg:w-56"
          >
            <div className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="text-[10px] font-medium text-gray-400">Digital Menu</span>
            </div>
            <div className="space-y-3 p-4">
              {["Cappuccino", "Cold Coffee", "Veg Sandwich"].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100" />
                  <div className="flex-1">
                    <div className="text-[10px] font-medium text-gray-800">{item}</div>
                    <div className="text-[9px] text-gray-400">Available</div>
                  </div>
                  <div className="text-[10px] font-bold text-indigo-600">₹{60 + i * 25}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Floating receipt card */}
          <motion.div
            initial={{ opacity: 0, x: -40, rotate: -5 }}
            animate={{ opacity: 1, x: 0, rotate: -3 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="absolute -top-4 -left-4 hidden w-44 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-xl sm:block lg:-left-8"
          >
            <div className="mb-2 text-xs font-bold text-gray-900">Quick Bill</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Items</span>
                <span className="font-medium text-gray-800">3</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-800">₹205</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">GST (5%)</span>
                <span className="font-medium text-gray-800">₹10</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-indigo-600">₹215</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
