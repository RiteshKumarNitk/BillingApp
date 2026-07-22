import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { buildMetadata } from "@/lib/marketing/seo";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description: "The terms that govern using CafeOS to run your cafe's website, ordering, kitchen, and billing.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-40">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-400">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="mt-10 space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-bold text-gray-900">1. Your Account</h2>
            <p className="mt-3">
              You're responsible for the accuracy of your cafe's information and for keeping your account
              credentials secure. You must be authorized to act on behalf of the business you register.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">2. Subscriptions &amp; Billing</h2>
            <p className="mt-3">
              Paid plans are billed monthly or yearly as selected at checkout. Every plan includes a free trial
              period, after which billing begins automatically unless you cancel first. You can cancel anytime from
              your account settings — access continues until the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">3. Acceptable Use</h2>
            <p className="mt-3">
              You agree not to use CafeOS to sell illegal goods, to misrepresent your business, or to interfere with
              the platform's operation or other tenants' use of it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">4. Your Data</h2>
            <p className="mt-3">
              You own the menu, order, and customer data you enter into CafeOS. We process it to operate the
              platform on your behalf, as described in our <a href="/privacy" className="text-indigo-600 hover:text-indigo-700">Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">5. Service Availability</h2>
            <p className="mt-3">
              We aim to keep CafeOS available and reliable, but the service is provided "as is" without guarantee of
              uninterrupted availability. We're not liable for losses arising from outages beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">6. Changes</h2>
            <p className="mt-3">
              We may update these terms as the platform evolves. Continued use of CafeOS after a change means you
              accept the updated terms.
            </p>
          </section>

          <p className="text-sm text-gray-400">
            These terms are provided as a general reference and do not constitute legal advice. We recommend having
            them reviewed by legal counsel before relying on them for your business.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
