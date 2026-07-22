"use client";

import { motion } from "framer-motion";
import { UserPlus, UtensilsCrossed, QrCode, Smartphone, ChefHat, Wallet, BarChart3 } from "lucide-react";
import Section from "@/components/marketing/Section";

const steps = [
  { icon: UserPlus, title: "Create Account", description: "Sign up and set your cafe's details — takes about a minute." },
  { icon: UtensilsCrossed, title: "Create Menu", description: "Add your items, sizes, add-ons, and combos." },
  { icon: QrCode, title: "Print QR", description: "Generate and print a QR code for each table." },
  { icon: Smartphone, title: "Customer Orders", description: "Guests scan, browse, and order from their phone." },
  { icon: ChefHat, title: "Kitchen Receives Order", description: "The order lands on your live Kitchen Queue instantly." },
  { icon: Wallet, title: "Collect Payment", description: "Cash, card, or UPI — settle the bill at the counter." },
  { icon: BarChart3, title: "Reports", description: "See sales, GST, and peak hours without any extra work." },
];

export default function HowItWorks() {
  return (
    <Section
      className="bg-white py-24"
      eyebrow="How It Works"
      title={
        <>
          From sign-up to
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            served, in 7 steps
          </span>
        </>
      }
    >
      <div className="mx-auto mt-16 max-w-3xl">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 * i }}
            className="relative flex gap-5 pb-10 last:pb-0"
          >
            {i < steps.length - 1 && (
              <div className="absolute left-6 top-14 h-full w-px bg-gray-200" />
            )}
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20">
              <step.icon className="h-5 w-5 text-white" />
            </div>
            <div className="pt-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-500">STEP {i + 1}</span>
              </div>
              <h3 className="mt-0.5 text-lg font-bold text-gray-900">{step.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
