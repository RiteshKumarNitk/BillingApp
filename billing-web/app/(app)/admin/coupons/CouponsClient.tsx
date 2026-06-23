"use client";

import { useState } from "react";
import { createCoupon, toggleCouponStatus } from "@/lib/actions/subscription";
import { Plus, Percent, Clock, Tag, X, Check, EyeOff } from "lucide-react";

type CouponsClientProps = {
  coupons: any[];
};

export default function CouponsClient({ coupons }: CouponsClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setCode("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setExpiryDate("");
    setMaxRedemptions("");
    setIsActive(true);
    setShowModal(true);
  };

  const handleToggleStatus = async (id: string) => {
    setToggleLoading(id);
    try {
      await toggleCouponStatus(id);
      window.location.reload();
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    } finally {
      setToggleLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountType || discountValue === "") {
      alert("Please fill in required fields");
      return;
    }
    setLoading(true);

    const payload = {
      code,
      discountType,
      discountValue: parseFloat(discountValue),
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
      isActive
    };

    try {
      await createCoupon(payload);
      setShowModal(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action panel */}
      <div className="flex justify-end">
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Coupon
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Coupon Code</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Discount Type</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Expiry Date</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Redemptions</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {coupons.map((coupon) => {
                const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                const isLimitReached = coupon.maxRedemptions && coupon.redemptions >= coupon.maxRedemptions;

                return (
                  <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-indigo-500" />
                      {coupon.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{coupon.discountType}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-950">
                      {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : "Never"}
                      {isExpired && <span className="text-rose-500 text-xs ml-1.5 font-semibold">(Expired)</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {coupon.redemptions} / {coupon.maxRedemptions || "∞"}
                      {isLimitReached && <span className="text-rose-500 text-xs ml-1.5 font-semibold">(Limit Reached)</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        coupon.isActive && !isExpired && !isLimitReached
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}>
                        {coupon.isActive && !isExpired && !isLimitReached ? "Active" : "Inactive / Expired"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(coupon.id)}
                        disabled={toggleLoading === coupon.id}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          coupon.isActive 
                            ? "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100" 
                            : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {toggleLoading === coupon.id 
                          ? "Updating..." 
                          : coupon.isActive ? "Deactivate" : "Activate"
                        }
                      </button>
                    </td>
                  </tr>
                );
              })}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No discount coupons configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-md w-full border border-gray-100 shadow-2xl overflow-hidden animate-scale-up"
          >
            {/* Header */}
            <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Configure Discount Coupon</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white opacity-85 hover:opacity-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="SAVE50, WELCOME200..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Discount Type *</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="e.g. 50 or 500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Max Redemptions</label>
                  <input
                    type="number"
                    min="1"
                    value={maxRedemptions}
                    onChange={(e) => setMaxRedemptions(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-800">
                  Coupon is Active
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Saving..." : "Create Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
