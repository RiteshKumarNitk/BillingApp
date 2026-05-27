import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6 text-center font-sans">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          Billing Management
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-500">
          A minimalist multi-tenant inventory and billing platform. 
          Manage your products, track transactions, and view analytics seamlessly.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Link
            href="/auth/login"
            className="group flex items-center gap-2 text-sm font-semibold text-gray-900 transition-colors hover:text-indigo-600"
          >
            Sign in
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden="true" />

          <Link
            href="/dashboard"
            className="group flex items-center gap-2 text-sm font-semibold text-gray-900 transition-colors hover:text-indigo-600"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </main>
  );
}