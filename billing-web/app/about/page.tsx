import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTA from "@/components/landing/CTA";
import PageHero from "@/components/marketing/PageHero";
import Section from "@/components/marketing/Section";
import { buildMetadata } from "@/lib/marketing/seo";
import { Target, Layers, Heart } from "lucide-react";

export const metadata = buildMetadata({
  title: "About Us",
  description: "CafeOS exists so cafe owners can run their website, ordering, kitchen, and billing from one place instead of juggling five different tools.",
  path: "/about",
});

const values = [
  {
    icon: Target,
    title: "Built for one thing",
    description: "Not a general billing tool stretched to fit cafes — every feature is designed around how a cafe actually runs, from the counter to the kitchen.",
  },
  {
    icon: Layers,
    title: "One platform, not five",
    description: "A website, ordering, kitchen queue, and POS shouldn't be five separate subscriptions that don't talk to each other. We built them to work as one.",
  },
  {
    icon: Heart,
    title: "Made for the owners who run the floor",
    description: "Cafe owners don't have time to learn complicated software. CafeOS is built to be usable on day one, not after a training course.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="About Us"
        title="We built CafeOS because running a cafe shouldn't mean running five apps"
        subtitle="A website builder here, a billing tool there, a separate kitchen display, a QR ordering add-on — most cafes end up stitching together tools that were never designed to work together. CafeOS is what happens when you build all of it as one platform from the start."
      />

      <Section className="bg-white py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {values.map((value) => (
            <div key={value.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
                <value.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{value.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{value.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <CTA />
      <Footer />
    </main>
  );
}
