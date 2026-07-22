import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTA from "@/components/landing/CTA";
import PageHero from "@/components/marketing/PageHero";
import Section from "@/components/marketing/Section";
import { buildMetadata } from "@/lib/marketing/seo";
import { Clock, Flame, CheckCircle2, Layers } from "lucide-react";

export const metadata = buildMetadata({
  title: "Kitchen Queue",
  description: "One live screen for every order — dine-in, takeaway, and QR/online — with Pending, Preparing, Ready, and Completed tracking.",
  path: "/kitchen-display",
});

const stages = [
  { icon: Clock, title: "Pending", description: "New orders appear the moment they're placed or accepted." },
  { icon: Flame, title: "Preparing", description: "Mark an order in progress so the whole team knows its status." },
  { icon: CheckCircle2, title: "Ready", description: "Flag it ready for pickup or table service, no shouting required." },
  { icon: Layers, title: "Completed", description: "Served orders clear off the board automatically." },
];

export default function KitchenDisplayPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="Kitchen Queue"
        title="One screen, every order"
        subtitle="Counter sales and QR/online orders land on the same live board — nothing gets missed, nothing gets duplicated."
      />

      <Section className="bg-white py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage) => (
            <div key={stage.title} className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
                <stage.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{stage.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{stage.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <CTA />
      <Footer />
    </main>
  );
}
