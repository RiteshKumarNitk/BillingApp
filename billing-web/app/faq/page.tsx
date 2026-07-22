import Navbar from "@/components/landing/Navbar";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { buildMetadata } from "@/lib/marketing/seo";

export const metadata = buildMetadata({
  title: "FAQ",
  description: "Answers to common questions about CafeOS — the free trial, QR ordering, GST invoicing, security, and support.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-40">
        <FAQ />
      </div>
      <CTA />
      <Footer />
    </main>
  );
}
