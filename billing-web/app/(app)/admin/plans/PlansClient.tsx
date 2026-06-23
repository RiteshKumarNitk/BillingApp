"use client";

import { useState } from "react";
import { createSubscriptionPlan, updateSubscriptionPlan } from "@/lib/actions/subscription";
import { Plus, Edit2, ShieldAlert, Check, X } from "lucide-react";

type PlansClientProps = {
  plans: any[];
};

export default function PlansClient({ plans }: PlansClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState("MONTHLY");
  const [trialDays, setTrialDays] = useState("0");
  const [maxProducts, setMaxProducts] = useState("-1");
  const [maxUsers, setMaxUsers] = useState("-1");
  const [maxTransactions, setMaxTransactions] = useState("-1");
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingPlan(null);
    setName("");
    setDescription("");
    setAmount("");
    setInterval("MONTHLY");
    setTrialDays("0");
    setMaxProducts("-1");
    setMaxUsers("-1");
    setMaxTransactions("-1");
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description || "");
    setAmount(String(plan.amount));
    setInterval(plan.interval);
    setTrialDays(String(plan.trialDays));
    setMaxProducts(String(plan.maxProducts));
    setMaxUsers(String(plan.maxUsers));
    setMaxTransactions(String(plan.maxTransactions));
    setIsActive(plan.isActive);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || amount === "" || !interval) {
      alert("Please fill in required fields");
      return;
    }
    setLoading(true);

    const payload = {
      name,
      description,
      amount: parseFloat(amount),
      interval,
      trialDays: parseInt(trialDays) || 0,
      maxProducts: parseInt(maxProducts) || -1,
      maxUsers: parseInt(maxUsers) || -1,
      maxTransactions: parseInt(maxTransactions) || -1,
      isActive
    };

    try {
      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.id, payload);
      } else {
        await createSubscriptionPlan(payload);
      }
      setShowModal(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to save plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action */}
      <div className="flex justify-end">
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Plan
        </button>
      </div>

      {/* Grid of plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative ${
              plan.isActive ? "border-gray-200" : "border-rose-200 bg-rose-50/10"
            }`}
          >
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-extrabold text-xl text-gray-900">{plan.name}</h3>
                <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 border ${
                  plan.isActive ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
                }`}>
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1 min-h-[40px]">{plan.description || "No plan description provided."}</p>

              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-extrabold text-gray-900">₹{plan.amount.toLocaleString()}</span>
                <span className="text-gray-500 text-sm ml-1">/ {plan.interval}</span>
              </div>

              <ul className="mt-6 space-y-3 pt-6 border-t border-gray-100 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>Max Products: <strong className="text-gray-900">{plan.maxProducts === -1 ? "Unlimited" : plan.maxProducts}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>Max Users: <strong className="text-gray-900">{plan.maxUsers === -1 ? "Unlimited" : plan.maxUsers}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>Max Monthly Txns: <strong className="text-gray-900">{plan.maxTransactions === -1 ? "Unlimited" : plan.maxTransactions}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>Trial Period: <strong className="text-gray-900">{plan.trialDays} Days</strong></span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => openEditModal(plan)}
                className="w-full py-2 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Configuration
              </button>
            </div>
          </div>
        ))}

        {plans.length === 0 && (
          <div className="col-span-3 text-center py-16 bg-white border border-gray-100 rounded-2xl">
            <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-semibold">No Subscription Plans configured</p>
            <p className="text-xs text-gray-400 mt-1">Configure packages to enable tenant registration and onboarding.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-lg w-full border border-gray-100 shadow-2xl overflow-hidden animate-scale-up"
          >
            {/* Header */}
            <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingPlan ? "Edit Plan Settings" : "Configure New Plan"}</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white opacity-85 hover:opacity-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fields */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-700">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Starter Pack, Growth Plan..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-700">Plan Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Price (INR) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Billing Interval *</label>
                  <select
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Free Trial (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Max Products (-1 = unlimited)</label>
                  <input
                    type="number"
                    min="-1"
                    value={maxProducts}
                    onChange={(e) => setMaxProducts(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Max Users (-1 = unlimited)</label>
                  <input
                    type="number"
                    min="-1"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Max Bills/Month (-1 = unlimited)</label>
                  <input
                    type="number"
                    min="-1"
                    value={maxTransactions}
                    onChange={(e) => setMaxTransactions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-gray-800">
                    Plan is Active and Visible to Customers
                  </label>
                </div>
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
                {loading ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
