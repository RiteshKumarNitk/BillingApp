"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Perfect for small shops and single stores.",
    price: { monthly: 299, yearly: 2999 },
    features: [
      "2 Staff Accounts",
      "10 QR Ordering Tables",
      "2 Website Themes",
      "Unlimited Menu Items",
      "Unlimited Orders",
      "POS Billing & GST Invoicing",
      "Kitchen Queue",
      "Email Support",
    ],
    cta: "Start Free Trial",
    popular: false,
    gradient: "from-gray-100 to-gray-200",
    buttonStyle: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  },
  {
    name: "Professional",
    description: "Best for growing businesses with multiple needs.",
    price: { monthly: 699, yearly: 6999 },
    features: [
      "Everything in Starter",
      "10 Staff Accounts",
      "Unlimited QR Tables",
      "All Website Themes",
      "Advanced Reports & Analytics",
      "Priority Support",
    ],
    cta: "Start Free Trial",
    popular: true,
    gradient: "from-indigo-600 to-violet-600",
    buttonStyle: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl",
  },
  {
    name: "Enterprise",
    description: "For large businesses with custom requirements.",
    price: { monthly: 1999, yearly: null },
    features: [
      "Everything in Professional",
      "Unlimited Staff Accounts",
      "Unlimited QR Tables",
      "All Website Themes",
      "Dedicated Priority Support",
    ],
    cta: "Contact Sales",
    popular: false,
    gradient: "from-gray-900 to-gray-800",
    buttonStyle: "border-2 border-gray-900 bg-gray-900 text-white hover:bg-gray-800",
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="relative bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700"
          >
            Pricing
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-gray-500"
          >
            🎉 Launch offer: get 3 months free. No credit card required. Cancel anytime.
          </motion.p>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 p-1"
          >
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                !annual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                annual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Yearly
              <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                2 months free
              </span>
            </button>
          </motion.div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className={`relative rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 ${
                plan.popular
                  ? "border-indigo-200 shadow-lg shadow-indigo-50 lg:scale-105"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                    <Zap className="h-3 w-3" fill="white" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
              </div>

              <div className="mb-8">
                {annual && plan.price.yearly === null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">Custom</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">
                        ₹{annual ? plan.price.yearly!.toLocaleString() : plan.price.monthly}
                      </span>
                      <span className="text-sm text-gray-500">/{annual ? "year" : "month"}</span>
                    </div>
                    {annual && (
                      <div className="mt-1 text-xs text-gray-400">
                        vs ₹{(plan.price.monthly * 12).toLocaleString()}/year billed monthly
                      </div>
                    )}
                  </>
                )}
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === "Enterprise" ? "#contact" : "/auth/register"}
                className={`block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all ${plan.buttonStyle}`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
