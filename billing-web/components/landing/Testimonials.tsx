"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Arjun Mehta",
    role: "Owner, Cafe Corner",
    content:
      "Our QR ordering setup took an afternoon. Now half our dine-in orders come straight from the table to the kitchen screen — no more shouted tickets, no more mix-ups.",
    rating: 5,
    avatar: "AM",
    color: "from-cyan-500 to-sky-500",
  },
  {
    name: "Priya Sharma",
    role: "Owner, Brew & Bloom",
    content:
      "The kitchen queue alone was worth switching for. Every order — counter or QR — lands in one place, and our prep time dropped noticeably in the first week.",
    rating: 5,
    avatar: "PS",
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "Rajesh Patel",
    role: "Manager, The Daily Grind",
    content:
      "Setting up combos and add-ons for our coffee menu was straightforward, and the POS calculates GST automatically — one less thing to get wrong at close.",
    rating: 5,
    avatar: "RP",
    color: "from-blue-500 to-indigo-500",
  },
  {
    name: "Anita Desai",
    role: "Owner, Leaf & Bean Tea House",
    content:
      "We picked a theme, added our menu, and had a real website live the same day. Customers scan the QR code on the table and browse the exact same menu.",
    rating: 5,
    avatar: "AD",
    color: "from-violet-500 to-purple-500",
  },
  {
    name: "Vikram Singh",
    role: "Owner, Sweet Spoon Desserts",
    content:
      "Reports show us our peak hours down to the day of the week — we've adjusted staffing around it and it's made a real difference on weekends.",
    rating: 5,
    avatar: "VS",
    color: "from-orange-500 to-amber-500",
  },
  {
    name: "Meera Reddy",
    role: "Owner, Third Wave Coffee Co.",
    content:
      "Running two outlets used to mean two separate systems. Now staff, menu, and reports all live in one place, and onboarding a new cashier takes minutes.",
    rating: 5,
    avatar: "MR",
    color: "from-pink-500 to-rose-500",
  },
];

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-24">
      {/* Background */}
      <div className="absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-200/20 to-violet-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700"
          >
            <Quote className="h-4 w-4" />
            Testimonials
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl"
          >
            Loved by cafe owners
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              across India
            </span>
          </motion.h2>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-gray-200 hover:shadow-lg"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Content */}
              <p className="mb-6 text-sm leading-relaxed text-gray-600">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.color} text-xs font-bold text-white`}
                >
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-xs text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
