"use client";

import { motion } from "framer-motion";
import { Globe, QrCode, ShoppingCart, ChefHat, Receipt, BarChart3, ArrowRight } from "lucide-react";
import Section from "@/components/marketing/Section";

const steps = [
  { icon: Globe, label: "Website" },
  { icon: QrCode, label: "QR Menu" },
  { icon: ShoppingCart, label: "Ordering" },
  { icon: ChefHat, label: "Kitchen" },
  { icon: Receipt, label: "POS" },
  { icon: BarChart3, label: "Reports" },
];

export default function FeatureFlow() {
  return (
    <Section
      className="bg-gradient-to-b from-gray-50 to-white py-24"
      eyebrow="How It Connects"
      title={
        <>
          Every step of a sale,
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            one connected flow
          </span>
        </>
      }
      subtitle="A customer's order moves from your website to the kitchen to your reports without you touching a second system."
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="mt-16 flex flex-wrap items-center justify-center gap-2 sm:gap-4"
      >
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2 sm:gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-white shadow-sm">
                <step.icon className="h-7 w-7 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold text-gray-700">{step.label}</span>
            </motion.div>
            {i < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
            )}
          </div>
        ))}
      </motion.div>
    </Section>
  );
}
