"use client";

import { motion } from "framer-motion";
import {
  Zap,
  QrCode,
  ChefHat,
  Cloud,
  Lock,
  Palette,
} from "lucide-react";

const reasons = [
  {
    icon: Zap,
    title: "Faster Order-to-Serve",
    description: "Orders go straight from the table or till to the kitchen — no shouted tickets, no lost slips.",
    stat: "10s",
    statLabel: "avg. checkout time",
  },
  {
    icon: QrCode,
    title: "Contactless QR Ordering",
    description: "Guests scan, browse, and order from their phone — fewer staff trips to the table, faster turns.",
    stat: "0",
    statLabel: "apps to install",
  },
  {
    icon: ChefHat,
    title: "One Kitchen Screen",
    description: "Dine-in, takeaway, and online orders all land on the same live queue — nothing falls through the cracks.",
    stat: "1",
    statLabel: "screen for every order",
  },
  {
    icon: Cloud,
    title: "Cloud-Based Access",
    description: "Check sales, menu, and orders from anywhere — home, another outlet, or on the move.",
    stat: "99.9%",
    statLabel: "uptime",
  },
  {
    icon: Lock,
    title: "Secure Data",
    description: "Encrypted data, regular backups, and role-based access so staff only see what they need to.",
    stat: "256-bit",
    statLabel: "encryption",
  },
  {
    icon: Palette,
    title: "A Website That's Actually Yours",
    description: "Pick a cafe-styled theme and customize colors, fonts, and sections — live in minutes.",
    stat: "8+",
    statLabel: "themes to choose from",
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
              Why CafeOS
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl"
            >
              Built for cafes
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                that want to grow
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-5 text-lg leading-relaxed text-gray-500"
            >
              CafeOS isn&apos;t another billing tool bolted onto your workflow. It&apos;s a complete cafe platform — website, ordering, kitchen, and POS — designed to work together from day one.
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
                { value: "90 Days", label: "Free Trial" },
                { value: "<10 min", label: "To Go Live" },
                { value: "8+", label: "Website Themes" },
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
