import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHero from "@/components/marketing/PageHero";
import Section from "@/components/marketing/Section";
import ContactForm from "./ContactForm";
import { buildMetadata } from "@/lib/marketing/seo";

export const metadata = buildMetadata({
  title: "Contact Us",
  description: "Have a question about CafeOS? Send us a message and we'll get back to you.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="Contact"
        title="Let's talk about your cafe"
        subtitle="Questions about pricing, a feature, or getting set up? Send us a message."
        primaryCta={null}
      />
      <Section className="bg-white py-16" containerClassName="mx-auto max-w-2xl px-6">
        <ContactForm />
      </Section>
      <Footer />
    </main>
  );
}
