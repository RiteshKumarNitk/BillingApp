"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Section from "@/components/marketing/Section";

const benefits = [
  "Spend less time managing, more time serving",
  "Serve customers faster with QR ordering",
  "A professional online presence, no coding required",
  "One software instead of five different tools",
  "Increase customer satisfaction with faster service",
  "Every order tracked, from table to till to kitchen",
];

export default function Benefits() {
  return (
    <Section className="bg-gradient-to-b from-white to-gray-50 py-24" containerClassName="mx-auto max-w-5xl px-6">
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-10 sm:p-14">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Why cafe owners switch to CafeOS
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 * i }}
              className="flex items-start gap-3 rounded-xl bg-white/70 p-4"
            >
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-800">{benefit}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
