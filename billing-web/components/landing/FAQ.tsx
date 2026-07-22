"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Is there a free trial available?",
    answer:
      "Yes — every plan includes a full 90-day free trial with no credit card required. Explore your website, QR ordering, kitchen queue, and POS before you pay anything.",
  },
  {
    question: "How does QR table ordering actually work?",
    answer:
      "Each table gets its own QR code linked to your live menu. A customer scans it, browses, and places their order from their phone — it lands straight on your Kitchen Queue, no app install or staff trip to the table required.",
  },
  {
    question: "Can I set up combos, sizes, and add-ons on my menu?",
    answer:
      "Yes. A menu item can be a simple fixed-price item, sized (Small/Medium/Large), or a combo built from other items — and you can add extras like \"Extra Shot\" or \"Extra Cheese\" with their own price on top.",
  },
  {
    question: "Do dine-in, takeaway, and online orders all show up in one place?",
    answer:
      "Yes — the Kitchen Queue unifies every order, whether it came from your POS or a customer's phone, into one live screen with Preparing/Ready/Served status.",
  },
  {
    question: "Does CafeOS support GST invoicing?",
    answer:
      "Yes. GST is calculated automatically per menu item — inclusive or exclusive — and every bill and receipt is GST-compliant out of the box.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. All data is encrypted in transit, access is role-based so staff only see what they need to, and your data is backed up regularly.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes. There are no long-term contracts — cancel anytime from your account settings, and you'll keep access until the end of your current billing period.",
  },
  {
    question: "What kind of support do you provide?",
    answer:
      "Email support on every plan, with priority support on Professional and dedicated priority support on Enterprise.",
  },
];

function FAQItem({ faq, index }: { faq: (typeof faqs)[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.05 * index }}
      className="border-b border-gray-100 last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-indigo-600"
        aria-expanded={open}
      >
        <span className="pr-4 text-sm font-semibold text-gray-900 sm:text-base">{faq.question}</span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            role="region"
          >
            <p className="pb-5 text-sm leading-relaxed text-gray-500">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="relative bg-gradient-to-b from-gray-50 to-white py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700"
          >
            <HelpCircle className="h-4 w-4" />
            FAQ
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl"
          >
            Frequently asked questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-xl text-lg text-gray-500"
          >
            Everything you need to know about CafeOS.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {faqs.map((faq, i) => (
            <FAQItem key={faq.question} faq={faq} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
