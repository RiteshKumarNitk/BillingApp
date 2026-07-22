import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { buildMetadata } from "@/lib/marketing/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How CafeOS collects, uses, and protects data for cafe owners and their customers.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-40">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-400">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="mt-10 max-w-none space-y-8 text-gray-600">
          <p>
            This policy explains what data CafeOS collects when a cafe owner uses the platform, and when their
            customers place an order through a CafeOS-powered website or QR menu, and how that data is used.
          </p>

          <section>
            <h2 className="text-xl font-bold text-gray-900">Information We Collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>Cafe owner accounts:</strong> name, email, phone, and business details provided at sign-up.</li>
              <li><strong>Menu and order data:</strong> products, prices, and transactions your cafe records.</li>
              <li><strong>End-customer data:</strong> name and phone number for guest checkout, or email/password for a customer account, collected when someone places an order through your website or QR menu.</li>
              <li><strong>Payment data:</strong> subscription billing is processed by our payment partner (Razorpay) — we do not store full card details ourselves.</li>
              <li><strong>Usage data:</strong> basic website visit and analytics data to help us and cafe owners understand traffic.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">How We Use It</h2>
            <p className="mt-3">
              Data is used to operate the platform — running your cafe's website, processing orders, generating bills
              and GST invoices, and showing your reports. We do not sell customer data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">Data Storage &amp; Security</h2>
            <p className="mt-3">
              Data is encrypted in transit. Access within our team is limited to what's needed to operate and support
              the platform. Each cafe's data is kept separate from every other cafe's data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">Your Rights</h2>
            <p className="mt-3">
              Cafe owners can request an export or deletion of their account's data by contacting us. End customers
              can request their order history and account data be deleted by contacting the cafe they ordered from,
              or us directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">Contact</h2>
            <p className="mt-3">
              Questions about this policy can be sent through our <a href="/contact" className="text-indigo-600 hover:text-indigo-700">contact page</a>.
            </p>
          </section>

          <p className="text-sm text-gray-400">
            This policy is provided as a general reference and does not constitute legal advice. If you operate a
            cafe on CafeOS, we recommend having it reviewed against your local data protection requirements.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
