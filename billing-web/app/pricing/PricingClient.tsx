"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";

export interface PricingTier {
  name: string;
  description: string;
  monthly: { amount: number; trialDays: number; maxUsers: number; maxTables: number; themeCount: number | "All" } | null;
  yearly: { amount: number } | null;
  popular: boolean;
}

export default function PricingClient({ tiers }: { tiers: PricingTier[] }) {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 p-1">
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
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3">
        {tiers.map((tier, i) => {
          const showYearly = annual && tier.yearly;
          const noYearlyOption = annual && !tier.yearly;
          const price = showYearly ? tier.yearly!.amount : tier.monthly?.amount;

          return (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className={`relative rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 ${
                tier.popular ? "border-indigo-200 shadow-lg shadow-indigo-50 lg:scale-105" : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                    <Zap className="h-3 w-3" fill="white" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{tier.description}</p>
              </div>

              <div className="mb-8">
                {noYearlyOption || price === undefined ? (
                  <span className="text-4xl font-extrabold text-gray-900">Custom</span>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">₹{price.toLocaleString()}</span>
                      <span className="text-sm text-gray-500">/{showYearly ? "year" : "month"}</span>
                    </div>
                    {showYearly && tier.monthly && (
                      <div className="mt-1 text-xs text-gray-400">
                        vs ₹{(tier.monthly.amount * 12).toLocaleString()}/year billed monthly
                      </div>
                    )}
                  </>
                )}
              </div>

              <ul className="mb-8 space-y-3">
                {tier.monthly && (
                  <>
                    <li className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <span className="text-sm text-gray-600">
                        {tier.monthly.maxUsers === -1 ? "Unlimited" : tier.monthly.maxUsers} Staff Accounts
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <span className="text-sm text-gray-600">
                        {tier.monthly.maxTables === -1 ? "Unlimited" : tier.monthly.maxTables} QR Tables
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <span className="text-sm text-gray-600">{tier.monthly.themeCount} Website Themes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <span className="text-sm text-gray-600">Unlimited Menu Items &amp; Orders</span>
                    </li>
                    {tier.monthly.trialDays > 0 && (
                      <li className="flex items-center gap-2 rounded-lg bg-indigo-50 p-2 text-sm font-semibold text-indigo-600">
                        {tier.monthly.trialDays}-Day Free Trial
                      </li>
                    )}
                  </>
                )}
              </ul>

              <Link
                href={tier.name === "Enterprise" ? "/contact" : "/auth/register"}
                className={`block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all ${
                  tier.popular
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tier.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
