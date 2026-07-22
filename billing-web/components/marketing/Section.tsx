"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { EYEBROW_CLASS } from "./tokens";

// Shared section wrapper — extracted from the eyebrow-badge/heading/subtitle pattern that used to
// be hand-repeated (with tiny drift) in every components/landing/*.tsx file. `title`/`subtitle`
// accept ReactNode so callers can still compose a gradient-highlighted span or a <br/>, exactly
// like the original inline markup did.
export default function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = "bg-white py-24",
  containerClassName = "mx-auto max-w-7xl px-6",
  headerClassName = "text-center",
}: {
  id?: string;
  eyebrow?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
  headerClassName?: string;
}) {
  const hasHeader = eyebrow || title || subtitle;

  return (
    <section id={id} className={`relative ${className}`}>
      <div className={containerClassName}>
        {hasHeader && (
          <div className={headerClassName}>
            {eyebrow && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={EYEBROW_CLASS}
              >
                {eyebrow}
              </motion.div>
            )}
            {title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl"
              >
                {title}
              </motion.h2>
            )}
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mx-auto mt-5 max-w-2xl text-lg text-gray-500"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
