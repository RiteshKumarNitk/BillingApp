"use client";

import { motion } from "framer-motion";
import {
  Receipt,
  Package,
  Users,
  BarChart3,
  Smartphone,
  Store,
  ScanBarcode,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Receipt,
    title: "POS Billing",
    description: "Lightning-fast point-of-sale with GST invoice generation, multiple payment modes, and automatic tax calculations.",
    gradient: "from-emerald-500 to-teal-500",
    bg: "from-emerald-50 to-teal-50",
  },
  {
    icon: Package,
    title: "Inventory Management",
    description: "Real-time stock tracking with batch management, expiry alerts, multi-location support, and automated reorder notifications.",
    gradient: "from-blue-500 to-indigo-500",
    bg: "from-blue-50 to-indigo-50",
  },
  {
    icon: Users,
    title: "Customer Management",
    description: "Complete CRM with loyalty programs, purchase history, credit management, and automated communication workflows.",
    gradient: "from-violet-500 to-purple-500",
    bg: "from-violet-50 to-purple-50",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics",
    description: "Powerful dashboards with revenue insights, product performance, employee metrics, and customizable report generation.",
    gradient: "from-orange-500 to-amber-500",
    bg: "from-orange-50 to-amber-50",
  },
  {
    icon: ScanBarcode,
    title: "Barcode & QR Billing",
    description: "Scan-and-bill with barcode/QR code support for products. Generate labels, manage product variants, and speed up checkout.",
    gradient: "from-pink-500 to-rose-500",
    bg: "from-pink-50 to-rose-50",
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    description: "Full-featured mobile POS for Android and iOS. Manage your business on the go with offline billing support.",
    gradient: "from-cyan-500 to-sky-500",
    bg: "from-cyan-50 to-sky-50",
  },
  {
    icon: Store,
    title: "Multi-Store Support",
    description: "Manage multiple stores from a single dashboard. Centralized inventory, store-specific analytics, and inter-store transfers.",
    gradient: "from-indigo-500 to-blue-500",
    bg: "from-indigo-50 to-blue-50",
  },
  {
    icon: Users,
    title: "Employee Management",
    description: "Manage staff roles, shifts, attendance, and performance. Assign permissions and track employee activity in real-time.",
    gradient: "from-rose-500 to-pink-500",
    bg: "from-rose-50 to-pink-50",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Granular permission controls for owners, managers, and staff. Secure data with enterprise-grade encryption.",
    gradient: "from-slate-600 to-slate-800",
    bg: "from-slate-50 to-gray-100",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section id="features" className="relative bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700"
          >
            Features
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl"
          >
            Everything you need to
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              run your business
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-gray-500"
          >
            From billing to inventory to analytics — one platform to manage it all. Built for businesses that move fast.
          </motion.p>
        </div>

        {/* Feature grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50"
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bg} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

              <div className="relative">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
