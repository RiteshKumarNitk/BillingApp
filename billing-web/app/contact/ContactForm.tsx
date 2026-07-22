"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Send } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  company?: string;
  message: string;
}

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  // Client-side validation is react-hook-form's own built-in rules below (no extra dependency
  // needed) — the server still re-validates with zod in app/api/marketing/contact/route.ts, which
  // stays the actual source of truth.
  const onSubmit = async (data: FormData) => {
    setStatus("idle");
    try {
      const res = await fetch("/api/marketing/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Something went wrong");
      setStatus("success");
      reset();
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h3 className="text-lg font-bold text-emerald-900">Message sent!</h3>
        <p className="mt-2 text-sm text-emerald-700">Thanks for reaching out — we&apos;ll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      {status === "error" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
        <input
          {...register("name", { required: "Name is required" })}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="Your name"
        />
        {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
        <input
          {...register("email", {
            required: "Email is required",
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
          })}
          type="email"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="you@yourcafe.com"
        />
        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Cafe / Business Name (optional)</label>
        <input
          {...register("company")}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="Your cafe's name"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
        <textarea
          {...register("message", { required: "Message is required" })}
          rows={5}
          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="How can we help?"
        />
        {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
        {!isSubmitting && <Send className="h-4 w-4" />}
      </button>
    </form>
  );
}
