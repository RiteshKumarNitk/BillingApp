import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import WhyChoose from "@/components/landing/WhyChoose";
import DashboardShowcase from "@/components/landing/DashboardShowcase";
import Industries from "@/components/landing/Industries";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "BillingApp — Modern POS, Inventory & Billing Platform",
  description:
    "All-in-one cloud platform for POS billing, inventory management, GST invoicing, customer analytics, and multi-store operations. Trusted by 500+ businesses across India.",
  openGraph: {
    title: "BillingApp — Modern POS, Inventory & Billing Platform",
    description:
      "All-in-one cloud platform for POS billing, inventory management, GST invoicing, customer analytics, and multi-store operations.",
    type: "website",
    siteName: "BillingApp",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <WhyChoose />
      <DashboardShowcase />
      <Industries />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}