import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTA from "@/components/landing/CTA";
import PageHero from "@/components/marketing/PageHero";
import Section from "@/components/marketing/Section";
import { buildMetadata } from "@/lib/marketing/seo";
import { Palette, Layers, Type, Image as ImageIcon, MousePointerClick, Code2 } from "lucide-react";

export const metadata = buildMetadata({
  title: "Website Builder & Themes",
  description: "Pick a cafe-styled theme and customize colors, fonts, logo, and sections — no coding required. Every cafe gets a website that looks like its own brand.",
  path: "/website-themes",
});

const capabilities = [
  { icon: Palette, title: "Multiple Themes", description: "Choose from cafe-styled themes built for coffee shops, tea houses, and dessert cafes." },
  { icon: MousePointerClick, title: "Live Editing", description: "Edit your site and see the result instantly — no publish-and-refresh guesswork." },
  { icon: Type, title: "Typography & Color", description: "Match your brand's fonts and colors across every page." },
  { icon: ImageIcon, title: "Logo & Sections", description: "Upload your logo and choose which sections appear — hero, menu, about, contact, and more." },
  { icon: Layers, title: "Section Control", description: "Reorder, show, or hide sections without touching a line of code." },
  { icon: Code2, title: "No Coding Required", description: "Everything is point-and-click. If you can use a phone, you can build your site." },
];

export default function WebsiteThemesPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="Website Builder"
        title="A website that's actually yours"
        subtitle="No two cafes should look identical. Pick a theme, make it yours, and go live in minutes — no developer required."
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
