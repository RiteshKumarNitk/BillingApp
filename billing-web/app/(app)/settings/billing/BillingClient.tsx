"use client";

import { useState } from "react";
import { 
  createCheckoutSession, 
  cancelSubscription, 
  applyCoupon 
} from "@/lib/actions/subscription";
import { 
  calculateProration, 
  changeSubscriptionPlan 
} from "@/lib/actions/proration";
import { 
  CreditCard, 
  Check, 
  Users, 
  Package, 
  Receipt, 
  AlertTriangle, 
  Clock, 
  XCircle,
  Percent,
  Download,
  Info
} from "lucide-react";

type BillingClientProps = {
  tenant: any;
  activeSub: any;
  subscriptions: any[];
  invoices: any[];
  plans: any[];
  usage: {
    products: number;
    users: number;
    transactions: number;
  };
};

export default function BillingClient({
  tenant,
  activeSub,
  subscriptions,
  invoices,
  plans,
  usage
}: BillingClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "plans" | "history">("overview");
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<{
    success: boolean;
    message: string;
    discountAmount: number;
    finalAmount: number;
    code: string;
  } | null>(null);
  
  const [selectedPlanForCoupon, setSelectedPlanForCoupon] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Proration states
  const [prorationDetails, setProrationDetails] = useState<any | null>(null);
  const [showProrationModal, setShowProrationModal] = useState(false);
  const [prorationLoading, setProrationLoading] = useState(false);

  // Active Plan features
  const currentPlanName = tenant.subscriptionPlan || "FREE";
  const activePlanDetails = activeSub?.plan || {
    name: "FREE",
    amount: 0,
    interval: "MONTHLY",
    maxProducts: 10,
    maxUsers: 2,
    maxTransactions: 20
  };

  const handleApplyCoupon = async (planId: string) => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponStatus(null);
    try {
      const res = await applyCoupon(couponCode, planId);
      setCouponStatus({
        success: true,
        message: `Coupon "${res.code}" applied successfully! Discount: ₹${res.discountAmount}`,
        discountAmount: res.discountAmount,
        finalAmount: res.finalAmount,
        code: res.code
      });
      setSelectedPlanForCoupon(planId);
    } catch (e: any) {
      setCouponStatus({
        success: false,
        message: e.message || "Failed to apply coupon",
        discountAmount: 0,
        finalAmount: 0,
        code: ""
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(planId);
    try {
      const isApplyingCoupon = selectedPlanForCoupon === planId && couponStatus?.success;
      const res = await createCheckoutSession(
        planId, 
        isApplyingCoupon ? couponStatus.code : undefined
      );
      
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (e: any) {
      alert(e.message || "Checkout failed");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleUpgradeClick = async (planId: string) => {
    if (!activeSub) {
      handleCheckout(planId);
      return;
    }
    
    setCheckoutLoading(planId);
    try {
      const details = await calculateProration(tenant.id, planId);
      setProrationDetails({ ...details, planId });
      setShowProrationModal(true);
    } catch (e: any) {
      alert(e.message || "Failed to calculate upgrade costs");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!prorationDetails) return;
    setProrationLoading(true);
    try {
      await changeSubscriptionPlan(tenant.id, prorationDetails.planId);
      setShowProrationModal(false);
      window.location.reload();
    } catch (e: any) {
      alert(e.message || "Failed to complete upgrade");
    } finally {
      setProrationLoading(false);
    }
  };

  const handleCancelSub = async (cancelAtPeriodEnd: boolean) => {
    if (!activeSub) return;
    setCancelLoading(true);
    try {
      await cancelSubscription(activeSub.id, cancelAtPeriodEnd);
      setShowCancelModal(false);
      window.location.reload();
    } catch (e: any) {
      alert(e.message || "Cancellation failed");
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "TRIAL":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PAST_DUE":
        return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
      case "CANCELLED":
      case "EXPIRED":
      case "UNPAID":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Grace Period Alert */}
      {activeSub?.status === "PAST_DUE" && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl border border-amber-200 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">Billing Action Required</h3>
            <p className="text-sm text-amber-700 mt-0.5">
              Your last subscription renewal payment failed. We are currently holding your account in a <strong>grace period</strong>. 
              Please verify or renew your payment details to avoid system suspension.
            </p>
            <button 
              onClick={() => setActiveTab("plans")}
              className="mt-2.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-xs font-semibold shadow-sm transition-colors"
            >
              Update Payment Method
            </button>
          </div>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="border-b border-gray-200 flex gap-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 cursor-pointer ${
            activeTab === "overview" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Plan Overview & Usage
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 cursor-pointer ${
            activeTab === "plans" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Pricing Plans & Upgrade
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 cursor-pointer ${
            activeTab === "history" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Payment History ({invoices.length})
        </button>
      </div>

      {/* Overview & Usage Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Plan Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between lg:col-span-1">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1">
                  Current Plan
                </span>
                <span className={`text-xs font-semibold border rounded-full px-2.5 py-1 ${getStatusBadgeClass(activeSub?.status || "ACTIVE")}`}>
                  {activeSub?.status || "ACTIVE"}
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-4">{currentPlanName}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {activeSub ? `₹${activePlanDetails.amount} / ${activePlanDetails.interval}` : "No Active Billing Plan"}
              </p>

              <div className="mt-6 space-y-3.5 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> Start Date</span>
                  <span className="font-semibold text-gray-800">
                    {activeSub ? new Date(activeSub.startDate).toLocaleDateString() : new Date(tenant.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> Renewal Date</span>
                  <span className="font-semibold text-gray-800">
                    {activeSub ? new Date(activeSub.endDate).toLocaleDateString() : "Never"}
                  </span>
                </div>
                {activeSub?.cancelAtPeriodEnd && (
                  <div className="bg-red-50 text-red-800 border border-red-100 rounded-lg p-2.5 text-xs flex gap-1.5 items-start mt-4">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Your subscription will end on <strong>{new Date(activeSub.endDate).toLocaleDateString()}</strong> and will not auto-renew.</span>
                  </div>
                )}
              </div>
            </div>

            {activeSub && !activeSub.cancelAtPeriodEnd && (
              <div className="mt-8">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full py-2 bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>

          {/* Usage Stats (Progress Bars) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2 space-y-6">
            <h3 className="font-bold text-gray-900 text-lg">Resource Limits</h3>
            <div className="space-y-6">
              {/* Product Limit */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 flex items-center gap-1.5"><Package className="w-4 h-4 text-indigo-500" /> Products Created</span>
                  <span className="font-semibold text-gray-900">
                    {usage.products} / {activePlanDetails.maxProducts === -1 ? "∞" : activePlanDetails.maxProducts}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      activePlanDetails.maxProducts === -1 
                        ? "bg-indigo-600" 
                        : (usage.products / activePlanDetails.maxProducts >= 0.9 ? "bg-rose-600" : "bg-indigo-600")
                    }`}
                    style={{ width: `${activePlanDetails.maxProducts === -1 ? 100 : Math.min(100, (usage.products / activePlanDetails.maxProducts) * 100)}%` }}
                  />
                </div>
              </div>

              {/* User Limit */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-500" /> Team Members</span>
                  <span className="font-semibold text-gray-900">
                    {usage.users} / {activePlanDetails.maxUsers === -1 ? "∞" : activePlanDetails.maxUsers}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      activePlanDetails.maxUsers === -1 
                        ? "bg-indigo-600" 
                        : (usage.users / activePlanDetails.maxUsers >= 0.9 ? "bg-rose-600" : "bg-indigo-600")
                    }`}
                    style={{ width: `${activePlanDetails.maxUsers === -1 ? 100 : Math.min(100, (usage.users / activePlanDetails.maxUsers) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Transactions Limit */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 flex items-center gap-1.5"><Receipt className="w-4 h-4 text-indigo-500" /> Bills Created (This Month)</span>
                  <span className="font-semibold text-gray-900">
                    {usage.transactions} / {activePlanDetails.maxTransactions === -1 ? "∞" : activePlanDetails.maxTransactions}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      activePlanDetails.maxTransactions === -1 
                        ? "bg-indigo-600" 
                        : (usage.transactions / activePlanDetails.maxTransactions >= 0.9 ? "bg-rose-600" : "bg-indigo-600")
                    }`}
                    style={{ width: `${activePlanDetails.maxTransactions === -1 ? 100 : Math.min(100, (usage.transactions / activePlanDetails.maxTransactions) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade / Plans Tab */}
      {activeTab === "plans" && (
        <div className="space-y-8">
          {/* Coupon Application Panel */}
          <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Percent className="w-6 h-6 text-indigo-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-indigo-900">Have a Promotional Coupon?</h4>
                <p className="text-sm text-indigo-700 mt-0.5">Enter coupon code to unlock exclusive discounts on monthly/yearly plans.</p>
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="PROMOCODE"
                className="px-3.5 py-2 border border-indigo-200 rounded-lg text-sm outline-none bg-white text-gray-800 w-full md:w-44 focus:ring-1 focus:ring-indigo-500 uppercase"
              />
              <button
                onClick={() => {
                  const targetPlan = plans.find(p => p.name !== "FREE");
                  if (targetPlan) {
                    handleApplyCoupon(targetPlan.id);
                  } else {
                    alert("No premium plans configured to apply coupon on.");
                  }
                }}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer"
              >
                {couponLoading ? "Validating..." : "Apply"}
              </button>
            </div>
          </div>

          {couponStatus && (
            <div className={`p-4 rounded-xl border text-sm ${couponStatus.success ? "bg-green-50 border-green-200 text-green-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
              {couponStatus.message}
            </div>
          )}

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan: any) => {
              const isCurrent = plan.name === currentPlanName;
              const hasCouponApplied = couponStatus?.success && selectedPlanForCoupon === plan.id;
              const finalPrice = hasCouponApplied ? couponStatus!.finalAmount : plan.amount;
              const isFree = plan.amount === 0;

              return (
                <div 
                  key={plan.id}
                  className={`bg-white rounded-2xl border p-6 flex flex-col justify-between relative shadow-sm hover:shadow-md transition-shadow ${
                    isCurrent ? "border-indigo-600 ring-1 ring-indigo-500/20" : "border-gray-200"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute top-0 right-6 transform -translate-y-1/2 bg-indigo-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Active Now
                    </span>
                  )}

                  <div>
                    <h3 className="font-extrabold text-xl text-gray-900">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mt-1 min-h-[40px]">{plan.description || `Best for business usage`}</p>

                    <div className="mt-4 flex items-baseline">
                      <span className="text-3xl font-extrabold text-gray-900">
                        ₹{finalPrice.toLocaleString()}
                      </span>
                      {hasCouponApplied && (
                        <span className="text-sm line-through text-gray-400 ml-2 font-medium">
                          ₹{plan.amount}
                        </span>
                      )}
                      <span className="text-gray-500 text-sm ml-1">/ {plan.interval}</span>
                    </div>

                    <ul className="mt-6 space-y-3 pt-6 border-t border-gray-100">
                      <li className="flex items-center gap-2.5 text-sm text-gray-600">
                        <Check className="w-4.5 h-4.5 text-indigo-500 flex-shrink-0" />
                        <span>
                          {plan.maxProducts === -1 ? "Unlimited" : plan.maxProducts} Products
                        </span>
                      </li>
                      <li className="flex items-center gap-2.5 text-sm text-gray-600">
                        <Check className="w-4.5 h-4.5 text-indigo-500 flex-shrink-0" />
                        <span>
                          {plan.maxUsers === -1 ? "Unlimited" : plan.maxUsers} Users
                        </span>
                      </li>
                      <li className="flex items-center gap-2.5 text-sm text-gray-600">
                        <Check className="w-4.5 h-4.5 text-indigo-500 flex-shrink-0" />
                        <span>
                          {plan.maxTransactions === -1 ? "Unlimited" : plan.maxTransactions} Bills / Month
                        </span>
                      </li>
                      {plan.trialDays > 0 && (
                        <li className="flex items-center gap-2.5 text-sm text-indigo-600 font-semibold bg-indigo-50 rounded-lg p-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{plan.trialDays} Days Free Trial</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-semibold cursor-not-allowed"
                      >
                        Active Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          // Apply coupon to this plan first if they clicked checkout
                          if (couponCode.trim() && selectedPlanForCoupon !== plan.id && !isFree) {
                            handleApplyCoupon(plan.id).then(() => handleUpgradeClick(plan.id));
                          } else {
                            handleUpgradeClick(plan.id);
                          }
                        }}
                        disabled={checkoutLoading !== null}
                        className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {checkoutLoading === plan.id ? "Initializing..." : isFree ? "Downgrade to Free" : "Subscribe / Upgrade"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invoices & History Tab */}
      {activeTab === "history" && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Invoice Number</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Billing Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Billing Period</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Net Amount</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(invoice.billingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {invoice.subscription?.plan?.name || "Premium Plan"} ({invoice.subscription?.plan?.interval || "MONTHLY"})
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ₹{invoice.netAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        invoice.status === "PAID" 
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                      No invoices recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 p-6 space-y-4 shadow-xl animate-scale-up">
            <h3 className="text-xl font-bold text-gray-900">Cancel Subscription</h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to cancel your premium subscription? Please select your preference below.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleCancelSub(true)}
                disabled={cancelLoading}
                className="w-full py-3 px-4 bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors flex items-start gap-3 cursor-pointer"
              >
                <div className="w-5 h-5 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 text-xs font-bold mt-0.5 flex-shrink-0">
                  ✓
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Cancel at end of cycle (Recommended)</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Maintain plan access until the renewal date of <strong>{new Date(activeSub.endDate).toLocaleDateString()}</strong>.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleCancelSub(false)}
                disabled={cancelLoading}
                className="w-full py-3 px-4 bg-white text-rose-800 border border-rose-100 hover:bg-rose-50 rounded-xl text-sm font-semibold transition-colors flex items-start gap-3 cursor-pointer"
              >
                <div className="w-5 h-5 bg-rose-50 rounded flex items-center justify-center text-rose-600 text-xs font-bold mt-0.5 flex-shrink-0">
                  ✕
                </div>
                <div className="text-left">
                  <p className="font-semibold text-rose-900 font-bold">Cancel immediately</p>
                  <p className="text-xs text-rose-400 mt-0.5">
                    Revoke access to premium features immediately. Your plan status will revert to FREE.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-950 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-100 overflow-hidden shadow-2xl animate-scale-up">
            {/* Header */}
            <div className="bg-indigo-600 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Receipt / Invoice</h3>
                <p className="text-xs text-indigo-200 mt-1">Invoice Number: {selectedInvoice.invoiceNumber}</p>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-white opacity-80 hover:opacity-100 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start text-sm">
                <div>
                  <h4 className="font-bold text-gray-900">Billed To</h4>
                  <p className="text-gray-600 mt-1">{tenant.name}</p>
                  <p className="text-gray-500">{tenant.email || "-"}</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-gray-900">Date Issued</h4>
                  <p className="text-gray-600 mt-1">{new Date(selectedInvoice.billingDate).toLocaleDateString()}</p>
                  <span className={`inline-block mt-2 rounded px-2 py-0.5 text-xs font-bold ${
                    selectedInvoice.status === "PAID" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-b border-gray-100 py-4 space-y-3 text-sm">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-600">SaaS Subscription - {selectedInvoice.subscription?.plan?.name || "Premium Plan"}</span>
                  <span className="text-gray-900">₹{selectedInvoice.amount.toLocaleString()}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon Discount</span>
                    <span>-₹{selectedInvoice.discountAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-950">
                <span>Total Paid</span>
                <span>₹{selectedInvoice.netAmount.toLocaleString()}</span>
              </div>

              {selectedInvoice.razorpayPaymentId && (
                <div className="bg-gray-50 rounded-xl p-3.5 text-xs text-gray-500 border border-gray-100 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-500" />
                  <span>Razorpay Txn: {selectedInvoice.razorpayPaymentId}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-1 cursor-pointer"
              >
                Print / Download
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proration / Upgrade Modal */}
      {showProrationModal && prorationDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 p-6 space-y-4 shadow-xl animate-scale-up">
            <h3 className="text-xl font-bold text-gray-900">Confirm Plan Change</h3>
            <p className="text-sm text-gray-500">
              You are about to change your subscription plan. We have calculated the prorated difference.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2 mt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">New Plan Amount:</span>
                <span className="font-semibold">₹{prorationDetails.newPlanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-indigo-600">
                <span>Credit for Unused Time ({prorationDetails.daysRemaining} days):</span>
                <span>- ₹{prorationDetails.unusedValue.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                <span>Total Due Today:</span>
                <span>₹{prorationDetails.proratedAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 gap-3">
              <button
                onClick={() => setShowProrationModal(false)}
                disabled={prorationLoading}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-950 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpgrade}
                disabled={prorationLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
              >
                {prorationLoading ? "Processing..." : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
