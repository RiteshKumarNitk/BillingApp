import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import FAQ from "@/components/landing/FAQ";
import PageHero from "@/components/marketing/PageHero";
import PricingClient, { type PricingTier } from "./PricingClient";
import prisma from "@/lib/prisma";
import { buildMetadata } from "@/lib/marketing/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Pricing",
  description: "Simple, transparent pricing for cafes of every size. Every plan includes a 90-day free trial, no credit card required.",
  path: "/pricing",
});

// Tier order/highlighting/description are marketing decisions this page owns; everything else
// (price, trial length, staff/table/theme limits) comes straight from the live SubscriptionPlan
// table (the same one /admin/plans configures) so this page can never drift from what's actually
// charged the way a second hardcoded copy could.
const TIER_META: Record<string, { description: string; popular: boolean }> = {
  Starter: { description: "Perfect for one cafe.", popular: false },
  Professional: { description: "For growing cafes with a team.", popular: true },
  Enterprise: { description: "Unlimited staff, tables, and themes.", popular: false },
};

export default async function PricingPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { amount: "asc" },
  });

  const tierNames = ["Starter", "Professional", "Enterprise"];
  const tiers: PricingTier[] = tierNames.map((name) => {
    const monthlyPlan = plans.find((p) => p.name === name && p.interval === "MONTHLY");
    const yearlyPlan = plans.find((p) => p.name === `${name} (Yearly)` && p.interval === "YEARLY");
    const meta = TIER_META[name];

    return {
      name,
      description: meta.description,
      popular: meta.popular,
      monthly: monthlyPlan
        ? {
            amount: monthlyPlan.amount,
            trialDays: monthlyPlan.trialDays,
            maxUsers: monthlyPlan.maxUsers,
            maxTables: monthlyPlan.maxTables,
            themeCount: monthlyPlan.allowedThemes.length > 0 ? monthlyPlan.allowedThemes.length : "All",
          }
        : null,
      yearly: yearlyPlan ? { amount: yearlyPlan.amount } : null,
    };
  });

  return (
    <main className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="Pricing"
        title="Simple, transparent pricing"
        subtitle="Every plan includes a 90-day free trial. No credit card required, cancel anytime."
        primaryCta={null}
      />
      <div className="bg-white pb-24">
        <PricingClient tiers={tiers} />
      </div>
      <FAQ />
      <Footer />
    </main>
  );
}
