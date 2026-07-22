import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import WhyChoose from "@/components/landing/WhyChoose";
import FeatureFlow from "@/components/landing/FeatureFlow";
import DashboardShowcase from "@/components/landing/DashboardShowcase";
import Industries from "@/components/landing/Industries";
import HowItWorks from "@/components/landing/HowItWorks";
import Benefits from "@/components/landing/Benefits";
import Testimonials from "@/components/landing/Testimonials";
import PricingPreview from "@/components/landing/PricingPreview";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { buildMetadata } from "@/lib/marketing/seo";

export const metadata = buildMetadata({
  title: "CafeOS — The Complete Cafe Management Platform",
  description:
    "Website, QR table ordering, kitchen queue, and POS billing with GST built in — everything your cafe needs, in one place. 90-day free trial, no credit card required.",
});

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <WhyChoose />
      <FeatureFlow />
      <DashboardShowcase />
      <Industries />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <PricingPreview />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
