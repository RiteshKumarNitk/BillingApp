import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { buildMetadata } from "@/lib/marketing/seo";

export const metadata = buildMetadata({
  title: "Cookie Policy",
  description: "How CafeOS uses cookies to keep you signed in and remember your preferences.",
  path: "/cookie-policy",
});

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-40">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Cookie Policy</h1>
        <p className="mt-2 text-sm text-gray-400">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="mt-10 space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-bold text-gray-900">What Cookies We Use</h2>
            <p className="mt-3">
              CafeOS uses a small number of cookies, all necessary for the platform to work:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>Session cookies:</strong> keep you signed in to your cafe dashboard or customer account.</li>
              <li><strong>Preference cookies:</strong> remember small choices, like a "remember me" login setting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">What We Don't Do</h2>
            <p className="mt-3">
              We don't use third-party advertising or tracking cookies on the CafeOS marketing site or dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">Managing Cookies</h2>
            <p className="mt-3">
              You can clear or block cookies through your browser settings at any time. Blocking session cookies
              will prevent you from staying signed in to your account.
            </p>
          </section>

          <p className="text-sm text-gray-400">
            This policy is provided as a general reference and does not constitute legal advice.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
