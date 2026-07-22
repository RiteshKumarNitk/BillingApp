import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTA from "@/components/landing/CTA";
import PageHero from "@/components/marketing/PageHero";
import Section from "@/components/marketing/Section";
import { buildMetadata } from "@/lib/marketing/seo";
import {
  Globe, QrCode, ChefHat, Receipt, BarChart3, Palette, Users, Shield,
} from "lucide-react";

export const metadata = buildMetadata({
  title: "Features",
  description: "Everything CafeOS includes: a professional website, QR table ordering, kitchen queue, POS billing, GST invoicing, reports, and staff management.",
  path: "/features",
});

const modules = [
  {
    icon: Globe,
    title: "Professional Website",
    description: "A live, mobile-friendly website for your cafe from day one.",
    points: ["Pick a cafe-styled theme", "Customize colors, fonts, and sections", "No coding required"],
  },
  {
    icon: Palette,
    title: "Website Builder & Themes",
    description: "Every cafe looks like its own brand, not a template.",
    points: ["Multiple website themes to choose from", "Live editing with instant preview", "Logo, typography, and section control"],
  },
  {
    icon: QrCode,
    title: "QR Table Ordering",
    description: "Guests order from their phone, no app install needed.",
    points: ["One QR code per table", "Guest checkout or account login", "Orders go straight to the kitchen"],
  },
  {
    icon: ChefHat,
    title: "Kitchen Queue",
    description: "Every order, from every channel, on one live screen.",
    points: ["Dine-in, takeaway, and online orders unified", "Preparing / Ready / Served tracking", "Nothing gets missed"],
  },
  {
    icon: Receipt,
    title: "POS Billing",
    description: "A fast touch POS built around how cafes actually sell.",
    points: ["Sizes, add-ons, and combos", "GST calculated automatically", "Cash, card, and UPI"],
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Know exactly how your cafe is performing.",
    points: ["Peak hours by day and time", "Payment method breakdown", "GST summary, ready for filing"],
  },
  {
    icon: Users,
    title: "Customer Management",
    description: "Every order builds a searchable customer history.",
    points: ["Guest and account-based orders both tracked", "Repeat customer visibility", "No separate CRM needed"],
  },
  {
    icon: Shield,
    title: "Staff & Role Management",
    description: "Give staff exactly the access they need.",
    points: ["Owner, Manager, and Cashier roles", "Granular permission controls", "Track who did what"],
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="Features"
        title="Everything your cafe needs, explained"
        subtitle="One platform covering your website, ordering, kitchen, and billing — built specifically for how cafes run."
      />

      <Section className="bg-white py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
          {modules.map((mod) => (
            <div
              key={mod.title}
              className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:border-gray-200 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20">
                <mod.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{mod.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{mod.description}</p>
              <ul className="mt-4 space-y-2">
                {mod.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <CTA />
      <Footer />
    </main>
  );
}
