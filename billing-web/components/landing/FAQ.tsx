"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Is there a free trial available?",
    answer:
      "Yes! We offer a full 14-day free trial with access to all Professional plan features. No credit card is required to start. You can explore every feature and decide if BillingApp is right for your business.",
  },
  {
    question: "Can I migrate data from my current billing software?",
    answer:
      "Absolutely. We provide free data migration support for all new customers. Our team will help you import your products, customers, and transaction history from any existing system. We support CSV, Excel, and direct database imports.",
  },
  {
    question: "Does BillingApp support GST invoicing?",
    answer:
      "Yes, BillingApp has built-in GST compliance. It automatically calculates CGST, SGST, and IGST based on your products and locations. You can generate GST-compliant invoices, file returns, and download reports in the format required by the government.",
  },
  {
    question: "How does multi-store management work?",
    answer:
      "You can add multiple stores under a single account. Each store has its own inventory, staff, and settings, but you can view consolidated reports across all locations. You can also transfer inventory between stores and manage centralized purchasing.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Security is our top priority. All data is encrypted at rest and in transit using 256-bit AES encryption. We perform daily automated backups, maintain SOC 2 compliance, and offer role-based access controls so you control who sees what.",
  },
  {
    question: "Do you offer a mobile app?",
    answer:
      "Yes, BillingApp has a full-featured mobile app for both Android and iOS. You can process POS bills, check inventory, view reports, and manage your store on the go. The app even works offline for billing in areas with poor connectivity.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Of course. There are no long-term contracts. You can cancel your subscription at any time from your account settings. If you cancel, you'll continue to have access until the end of your current billing period.",
  },
  {
    question: "What kind of support do you provide?",
    answer:
      "We offer email support for all plans, with priority support for Professional and Enterprise customers. Enterprise plans include a dedicated account manager, phone support, and custom training sessions for your team.",
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
            Everything you need to know about BillingApp.
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
