import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTA from "@/components/landing/CTA";
import PageHero from "@/components/marketing/PageHero";
import Section from "@/components/marketing/Section";
import { buildMetadata } from "@/lib/marketing/seo";
import { Search, ShoppingCart, Radar, LogIn, Smartphone } from "lucide-react";

export const metadata = buildMetadata({
  title: "Customer Ordering",
  description: "A clean, searchable menu with cart and live order tracking — guest checkout or account login, built for the customer's phone.",
  path: "/online-ordering",
});

const capabilities = [
  { icon: Search, title: "Menu & Search", description: "Categories and search make finding an item fast, even on a long menu." },
  { icon: ShoppingCart, title: "Cart", description: "Sizes, add-ons, and combos, all reflected in the cart before checkout." },
  { icon: Radar, title: "Live Order Tracking", description: "Customers see their order move from placed to ready in real time." },
  { icon: LogIn, title: "Guest Checkout or Login", description: "Order with just a name and phone, or sign in to save history." },
  { icon: Smartphone, title: "Built for Mobile", description: "Designed for a phone screen first — no awkward pinch-to-zoom menus." },
];

export default function OnlineOrderingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="Customer Ordering"
        title="An ordering experience customers actually enjoy"
        subtitle="From menu to checkout to tracking, built for the phone in a customer's hand."
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
