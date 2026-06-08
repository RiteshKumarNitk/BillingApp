"use client";

import { motion } from "framer-motion";
import {
  Store,
  ShoppingCart,
  Pill,
  Cpu,
  Shirt,
  UtensilsCrossed,
  Warehouse,
} from "lucide-react";

const industries = [
  {
    icon: Store,
    name: "Retail Shops",
    description: "Complete POS and inventory management for general retail stores.",
    businesses: "200+",
  },
  {
    icon: ShoppingCart,
    name: "Grocery Stores",
    description: "Batch tracking, expiry management, and weight-based billing.",
    businesses: "150+",
  },
  {
    icon: Pill,
    name: "Medical Stores",
    description: "Drug inventory, prescription billing, and compliance reporting.",
    businesses: "100+",
  },
  {
    icon: Cpu,
    name: "Electronics Stores",
    description: "IMEI tracking, warranty management, and serial number billing.",
    businesses: "80+",
  },
  {
    icon: Shirt,
    name: "Fashion Stores",
    description: "Size/color variants, seasonal collections, and style-based inventory.",
    businesses: "60+",
  },
  {
    icon: UtensilsCrossed,
    name: "Restaurants",
    description: "Menu management, table billing, and kitchen order tracking.",
    businesses: "50+",
  },
  {
    icon: Warehouse,
    name: "Wholesalers",
    description: "Bulk billing, credit management, and multi-location distribution.",
    businesses: "70+",
  },
];

export default function Industries() {
  return (
    <section id="industries" className="relative bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700"
          >
            Industries
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl"
          >
            Trusted across
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              every industry
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-gray-500"
          >
            From retail to restaurants, BillingApp adapts to your business needs with industry-specific features.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {industries.map((industry, i) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className={`group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 ${
                i === industries.length - 1 && industries.length % 4 === 3
                  ? "sm:col-span-2 lg:col-span-1"
                  : ""
              }`}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20">
                <industry.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{industry.name}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{industry.description}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {industry.businesses} businesses
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
