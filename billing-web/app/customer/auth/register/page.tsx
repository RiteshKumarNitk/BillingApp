"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight, Phone, ShoppingBag } from "lucide-react";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/customer/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/customer/auth/login");
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] flex flex-col">
      {/* Zepto-style header */}
      <div className="bg-[#FFE11B] px-6 pt-12 pb-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#2D2D2D] rounded-2xl flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-6 h-6 text-[#FFE11B]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#2D2D2D] tracking-tight">BillingApp</h1>
            <p className="text-xs font-semibold text-[#2D2D2D]/60">Delivery in 10 minutes</p>
          </div>
        </div>
      </div>

      {/* Register Form */}
      <div className="flex-1 px-6 -mt-5">
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-black text-[#2D2D2D] mb-1">Create Account</h2>
          <p className="text-xs text-gray-500 mb-5">Start ordering from your favorite stores</p>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-xs font-semibold animate-slide-up">
                {error}
              </div>
            )}

            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#2D2D2D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFE11B] focus:border-[#FFE11B] transition-all"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#2D2D2D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFE11B] focus:border-[#FFE11B] transition-all"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#2D2D2D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFE11B] focus:border-[#FFE11B] transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#2D2D2D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFE11B] focus:border-[#FFE11B] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black text-[#2D2D2D] bg-[#FFE11B] hover:bg-[#FFD000] disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-[#2D2D2D]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-sm text-gray-500">Already have an account? </span>
            <Link href="/customer/auth/login" className="text-sm font-black text-[#FFE11B] hover:text-[#FFD000]">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
}
