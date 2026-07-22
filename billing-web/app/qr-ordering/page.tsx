import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTA from "@/components/landing/CTA";
import PageHero from "@/components/marketing/PageHero";
import Section from "@/components/marketing/Section";
import { buildMetadata } from "@/lib/marketing/seo";
import { QrCode, UtensilsCrossed, ShoppingCart, LogIn, CheckCircle2, ChefHat, Bell, Wallet } from "lucide-react";

export const metadata = buildMetadata({
  title: "QR Table Ordering",
  description: "Customers scan a QR code at their table, browse your menu, and order straight from their phone — no app install, straight to the kitchen.",
  path: "/qr-ordering",
});

const journey = [
  { icon: QrCode, title: "Scan QR", description: "Each table has its own code — no app to download." },
  { icon: UtensilsCrossed, title: "Browse Menu", description: "The exact menu you manage, with sizes and add-ons." },
  { icon: ShoppingCart, title: "Add to Cart", description: "Pick items, sizes, and extras at their own pace." },
  { icon: LogIn, title: "Guest Checkout or Login", description: "Order as a guest with just a name and phone, or sign in." },
  { icon: CheckCircle2, title: "Order Placed", description: "Confirmation shown instantly, no waiting for staff." },
  { icon: ChefHat, title: "Kitchen Receives Order", description: "It lands on your live Kitchen Queue immediately." },
  { icon: Bell, title: "Food Ready", description: "Staff mark it ready — no shouting across the counter." },
  { icon: Wallet, title: "Pay Offline", description: "Settle the bill at the counter, same as always." },
];

export default function QrOrderingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="QR Ordering"
        title="Contactless ordering, straight to the kitchen"
        subtitle="No app to install, no waiting for a server to take the order — just a scan and a few taps."
      />

      <Section className="bg-white py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {journey.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <span className="text-xs font-bold text-indigo-500">STEP {i + 1}</span>
              <div className="mt-3 mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
                <step.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{step.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <CTA />
      <Footer />
    </main>
  );
}
