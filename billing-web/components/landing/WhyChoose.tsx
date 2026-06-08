"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Database,
  TrendingUp,
  Cloud,
  Lock,
  Layers,
} from "lucide-react";

const reasons = [
  {
    icon: Zap,
    title: "Faster Billing",
    description: "Complete a transaction in under 10 seconds with our optimized POS. No more long queues or slow systems.",
    stat: "10s",
    statLabel: "avg. checkout time",
  },
  {
    icon: Database,
    title: "Better Inventory Control",
    description: "Know exactly what's in stock, what's running low, and what needs reordering — all in real-time.",
    stat: "99.9%",
    statLabel: "stock accuracy",
  },
  {
    icon: TrendingUp,
    title: "Business Insights",
    description: "Data-driven decisions with actionable analytics, profit reports, and sales forecasting tools.",
    stat: "50+",
    statLabel: "report types",
  },
  {
    icon: Cloud,
    title: "Cloud-Based Access",
    description: "Access your business from anywhere. Manage your store from home, office, or on the road.",
    stat: "99.99%",
    statLabel: "uptime SLA",
  },
  {
    icon: Lock,
    title: "Secure Data",
    description: "Enterprise-grade security with encrypted data, regular backups, and role-based access controls.",
    stat: "256-bit",
    statLabel: "encryption",
  },
  {
    icon: Layers,
    title: "Scalable Architecture",
    description: "Multi-tenant design that grows with your business. From single store to hundreds — no limits.",
    stat: "10K+",
    statLabel: "products supported",
  },
];

export default function WhyChoose() {
  return (
    <section id="why-choose" className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24">
      {/* Background decoration */}
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-200/20 to-violet-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left - Text */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700"
            >
              Why BillingApp
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl"
            >
              Built for businesses
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                that demand more
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-5 text-lg leading-relaxed text-gray-500"
            >
              BillingApp isn&apos;t just another billing tool. It&apos;s a complete business management platform designed to help you work smarter, faster, and more efficiently.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-10 grid grid-cols-3 gap-6"
            >
              {[
                { value: "500+", label: "Active Businesses" },
                { value: "10M+", label: "Invoices Generated" },
                { value: "4.9★", label: "User Rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right - Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {reasons.map((reason, i) => (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
                    <reason.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{reason.stat}</div>
                    <div className="text-[10px] text-gray-400">{reason.statLabel}</div>
                  </div>
                </div>
                <h3 className="mb-1 text-sm font-bold text-gray-900">{reason.title}</h3>
                <p className="text-xs leading-relaxed text-gray-500">{reason.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
