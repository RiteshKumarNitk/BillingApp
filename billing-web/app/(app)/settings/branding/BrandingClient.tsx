"use client";

import { useState } from "react";
import { updateBranding } from "@/lib/actions/tenants";
import { Palette, Type, CheckCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

export default function BrandingSettingsPage({ tenant }: { tenant: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      primaryColor: tenant?.primaryColor || "#4F46E5",
      fontFamily: tenant?.fontFamily || "Inter, sans-serif"
    }
  });

  const previewColor = watch("primaryColor");
  const previewFont = watch("fontFamily");

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSuccess(false);
    try {
      await updateBranding(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || "Failed to update branding");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">White-Label Branding</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customize the look and feel of your customer-facing invoices and receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-gray-500" />
                Primary Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  {...register("primaryColor")}
                  className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  {...register("primaryColor", { 
                    pattern: { value: /^#([0-9A-F]{3}){1,2}$/i, message: "Invalid hex code" } 
                  })}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  placeholder="#4F46E5"
                />
              </div>
              {errors.primaryColor && <p className="text-xs text-red-500 mt-1">{errors.primaryColor.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Type className="w-4 h-4 text-gray-500" />
                Typography (Font Family)
              </label>
              <select
                {...register("fontFamily")}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              >
                <option value="Inter, sans-serif">Inter (Modern, Sans-serif)</option>
                <option value="'Roboto', sans-serif">Roboto (Clean, Sans-serif)</option>
                <option value="'Playfair Display', serif">Playfair Display (Elegant, Serif)</option>
                <option value="'Merriweather', serif">Merriweather (Classic, Serif)</option>
                <option value="'Space Mono', monospace">Space Mono (Tech, Monospace)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Branding Preferences"}
          </button>

          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2 border border-green-100">
              <CheckCircle className="w-4 h-4" />
              Branding updated successfully.
            </div>
          )}
        </form>

        {/* Live Preview */}
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Live Invoice Preview</h3>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg transform scale-95 origin-top">
            <div 
              style={{ backgroundColor: previewColor, fontFamily: previewFont }} 
              className="p-6 text-white"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">INVOICE</h2>
                <span className="opacity-80">INV-001</span>
              </div>
            </div>
            <div style={{ fontFamily: previewFont }} className="p-6 space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Premium SaaS Plan</span>
                <span className="font-bold text-gray-900">₹2,999.00</span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span style={{ color: previewColor }}>₹2,999.00</span>
              </div>
              <button 
                style={{ backgroundColor: previewColor }} 
                className="w-full py-2 rounded-lg text-white font-semibold text-sm mt-4 opacity-90"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
