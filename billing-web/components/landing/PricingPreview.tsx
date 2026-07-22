"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import Section from "@/components/marketing/Section";

const plans = [
  { name: "Starter", price: 299, description: "Perfect for one cafe.", popular: false },
  { name: "Professional", price: 699, description: "For growing cafes with a team.", popular: true },
  { name: "Enterprise", price: 1999, description: "Unlimited staff, tables, and themes.", popular: false },
];

export default function PricingPreview() {
  return (
    <Section
      className="bg-white py-24"
      eyebrow="Pricing"
      title={
        <>
          Simple pricing,
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            no surprises
          </span>
        </>
      }
      subtitle="Every plan includes a 90-day free trial. No credit card required."
    >
      <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 * i }}
            className={`relative rounded-2xl border bg-white p-6 shadow-sm ${
              plan.popular ? "border-indigo-200 shadow-lg shadow-indigo-50" : "border-gray-200"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                  <Zap className="h-3 w-3" fill="white" />
                  Most Popular
                </span>
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
            <p className="mt-1 text-xs text-gray-500">{plan.description}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-gray-900">₹{plan.price}</span>
              <span className="text-sm text-gray-500">/month</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl"
        >
          See full pricing & features
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Section>
  );
}
