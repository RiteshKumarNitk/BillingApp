import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTA from "@/components/landing/CTA";
import PageHero from "@/components/marketing/PageHero";
import Section from "@/components/marketing/Section";
import { buildMetadata } from "@/lib/marketing/seo";
import { LayoutGrid, Ruler, PackagePlus, Percent, Receipt, Wallet } from "lucide-react";

export const metadata = buildMetadata({
  title: "POS Billing",
  description: "A fast touch POS built for cafes — category sidebar, sizes, combo builder, discounts, and GST calculated automatically. Cash, card, and UPI supported.",
  path: "/pos",
});

const capabilities = [
  { icon: LayoutGrid, title: "Category Sidebar", description: "Jump between menu categories with one tap during a rush." },
  { icon: Ruler, title: "Sizes & Add-ons", description: "Small/Medium/Large pricing and extras like \"Extra Shot\", captured on every line." },
  { icon: PackagePlus, title: "Combo Builder", description: "Bundle existing menu items into a combo with its own price, not a manual re-entry." },
  { icon: Percent, title: "Discounts & GST", description: "Apply a discount and let GST calculate itself — inclusive or exclusive, per item." },
  { icon: Wallet, title: "Cash, Card, UPI", description: "Take payment however the customer prefers, split payments included." },
  { icon: Receipt, title: "Instant Receipt", description: "A clean, GST-compliant receipt generated the moment the sale completes." },
];

export default function PosPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="POS Billing"
        title="A till built for how cafes actually sell"
        subtitle="Sizes, add-ons, combos, and GST — handled automatically, so your staff can focus on the counter, not the calculator."
      />

      <Section className="bg-white py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap) => (
            <div key={cap.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
                <cap.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{cap.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{cap.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <CTA />
      <Footer />
    </main>
  );
}
