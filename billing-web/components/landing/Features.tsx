"use client";

import { motion } from "framer-motion";
import {
  Globe,
  QrCode,
  Receipt,
  ChefHat,
  BarChart3,
  Palette,
  Users,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Professional Website",
    description: "A branded, mobile-friendly website for your cafe — live in minutes, no coding required.",
    gradient: "from-indigo-500 to-blue-500",
    bg: "from-indigo-50 to-blue-50",
  },
  {
    icon: QrCode,
    title: "QR Table Ordering",
    description: "Customers scan, browse your digital menu, and order straight from their table — no app install needed.",
    gradient: "from-emerald-500 to-teal-500",
    bg: "from-emerald-50 to-teal-50",
  },
  {
    icon: ChefHat,
    title: "Kitchen Queue",
    description: "Every order — table or counter — lands on one live kitchen screen with Preparing/Ready status tracking.",
    gradient: "from-orange-500 to-amber-500",
    bg: "from-orange-50 to-amber-50",
  },
  {
    icon: Receipt,
    title: "POS Billing",
    description: "A fast touch POS built for cafes — sizes, add-ons, and combos, with GST calculated automatically.",
    gradient: "from-pink-500 to-rose-500",
    bg: "from-pink-50 to-rose-50",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Peak hours, payment mix, and GST summaries so you know exactly how your cafe is performing.",
    gradient: "from-violet-500 to-purple-500",
    bg: "from-violet-50 to-purple-50",
  },
  {
    icon: Palette,
    title: "Multiple Website Themes",
    description: "Pick from cafe-styled themes and customize colors, fonts, and sections to match your brand.",
    gradient: "from-cyan-500 to-sky-500",
    bg: "from-cyan-50 to-sky-50",
  },
  {
    icon: Users,
    title: "Customer Database",
    description: "Every guest and order builds a searchable customer history — no separate CRM needed.",
    gradient: "from-rose-500 to-pink-500",
    bg: "from-rose-50 to-pink-50",
  },
  {
    icon: Shield,
    title: "Staff & Role Management",
    description: "Give owners, managers, and cashiers exactly the access they need, nothing more.",
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
            Everything your cafe
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              needs, in one place
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-gray-500"
          >
            From your website to the kitchen to the till — one platform, so you never need to juggle multiple tools again.
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
