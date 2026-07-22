"use client";

import { motion } from "framer-motion";
import { Coffee, Leaf, IceCreamCone, Store } from "lucide-react";

const perfectFor = [
  {
    icon: Coffee,
    name: "Coffee Shops",
    description: "Sized drinks, add-ons, and a QR menu customers can order from at the table.",
  },
  {
    icon: Leaf,
    name: "Tea Cafes",
    description: "Fast counter billing with combos and GST built in, no extra setup.",
  },
  {
    icon: IceCreamCone,
    name: "Dessert Cafes",
    description: "A branded website and digital menu that shows off what you serve.",
  },
  {
    icon: Store,
    name: "Small Cafe Chains",
    description: "One dashboard, one kitchen queue standard, every outlet run the same way.",
  },
];

export default function Industries() {
  return (
    <section id="perfect-for" className="relative bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700"
          >
            Perfect For
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl"
          >
            Built for one thing:
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              running a great cafe
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-gray-500"
          >
            CafeOS isn&apos;t a general-purpose billing tool stretched to fit — every feature is built around how cafes actually work.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {perfectFor.map((type, i) => (
            <motion.div
              key={type.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20">
                <type.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{type.name}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{type.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
