"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Clock, IndianRupee, MapPin, LocateFixed } from 'lucide-react';

export default function SettingsForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    contactPerson: initialData.contactPerson || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    address: initialData.address || "",
    landmark: initialData.landmark || "",
    city: initialData.city || "",
    state: initialData.state || "",
    country: initialData.country || "",
    postalCode: initialData.postalCode || "",
    latitude: initialData.latitude ?? "",
    longitude: initialData.longitude ?? "",
    gstin: initialData.gstin || "",
    website: initialData.website || "",
    currency: initialData.currency || "INR",
    timezone: initialData.timezone || "Asia/Kolkata",
    businessType: initialData.businessType || "",
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Browser HTML5 Geolocation — no Google Maps/Places API, no key. Fills lat/lng only; the owner
  // can still hand-adjust either field afterward if the GPS fix is imprecise.
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location detection. Enter latitude/longitude manually.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocating(false);
      },
      () => {
        setError('Could not get your current location. Check your browser\'s location permission, or enter coordinates manually.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update settings");
      }

      setSuccess("Settings updated successfully!");
      router.refresh();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
      {success && <div className="p-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="gstin" className="block text-sm font-medium text-gray-700 mb-2">GSTIN (Optional)</label>
          <input
            type="text"
            id="gstin"
            name="gstin"
            value={formData.gstin}
            onChange={handleChange}
            placeholder="e.g. 22AAAAA0000A1Z5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
          <select
            id="businessType"
            name="businessType"
            value={formData.businessType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
          >
            <option value="">Not set / general</option>
            <option value="CAFE">Cafe</option>
            <option value="LAUNDRY">Laundry</option>
            <option value="SALON">Salon</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">Tailors your Products and billing screen to your business. Leave unset to keep the current general setup.</p>
        </div>

        <div>
          <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
          <input
            type="text"
            id="contactPerson"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
          />
        </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                ></textarea>
              </div>

              <div className="md:col-span-2 border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> Location
                  </h3>
                  <p className="text-xs text-gray-400">Powers nearby-cafe sorting and directions in the CafeOS app and your website — no Google Maps account needed.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="landmark" className="block text-xs font-medium text-gray-700 mb-1">Landmark (optional)</label>
                    <input type="text" id="landmark" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Near Central Park" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-xs font-medium text-gray-700 mb-1">State</label>
                    <input type="text" id="state" name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
                    <input type="text" id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="country" className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                    <input type="text" id="country" name="country" value={formData.country} onChange={handleChange} placeholder="India" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                  </div>

                  <div>
                    <label htmlFor="latitude" className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                    <input type="number" step="any" id="latitude" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="26.912434" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                  </div>
                  <div>
                    <label htmlFor="longitude" className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                    <input type="number" step="any" id="longitude" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="75.787270" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                    >
                      <LocateFixed className="w-4 h-4" />
                      {locating ? 'Getting your location...' : 'Use My Current Location'}
                    </button>
                    <p className="text-xs text-gray-400 mt-1">Fills the coordinates above from your browser — adjust by hand afterward if it's not quite right.</p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
