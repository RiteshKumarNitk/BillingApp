"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, CreditCard, ShieldCheck } from "lucide-react";

export default function CheckoutClient({ subscription }: { subscription: any }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleSimulate = async (success: boolean) => {
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      if (success) {
        // 1. Simulate subscription.activated
        const resAct = await fetch("/api/webhooks/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "subscription.activated",
            payload: {
              subscription: {
                entity: {
                  id: subscription.razorpaySubscriptionId || `sub_mock_${subscription.id}`,
                  plan_id: subscription.plan.razorpayPlanId || "plan_mock_123",
                  amount: subscription.plan.amount * 100,
                  currency: "INR",
                  status: "active",
                  notes: {
                    tenantId: subscription.tenantId
                  }
                }
              }
            }
          })
        });

        if (!resAct.ok) throw new Error("Failed to activate subscription webhook");

        // 2. Simulate subscription.charged (payment)
        const resCharge = await fetch("/api/webhooks/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "subscription.charged",
            payload: {
              subscription: {
                entity: {
                  id: subscription.razorpaySubscriptionId || `sub_mock_${subscription.id}`,
                  plan_id: subscription.plan.razorpayPlanId || "plan_mock_123",
                  amount: subscription.plan.amount * 100,
                  currency: "INR",
                  status: "active",
                  notes: {
                    tenantId: subscription.tenantId
                  }
                }
              },
              payment: {
                entity: {
                  id: `pay_mock_${Math.random().toString(36).substring(2, 10)}`
                }
              }
            }
          })
        });

        if (!resCharge.ok) throw new Error("Failed to charge subscription webhook");

        setStatus("success");
        setTimeout(() => {
          router.push("/settings/billing");
          router.refresh();
        }, 1500);
      } else {
        // Simulate payment failure
        const resFail = await fetch("/api/webhooks/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "subscription.pending",
            payload: {
              subscription: {
                entity: {
                  id: subscription.razorpaySubscriptionId || `sub_mock_${subscription.id}`,
                  plan_id: subscription.plan.razorpayPlanId || "plan_mock_123",
                  amount: subscription.plan.amount * 100,
                  currency: "INR",
                  status: "authenticated",
                  notes: {
                    tenantId: subscription.tenantId
                  }
                }
              }
            }
          })
        });

        if (!resFail.ok) throw new Error("Failed to process payment failure webhook");

        setStatus("failed");
        setErrorMessage("Card declined. Insufficient funds or invalid details.");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "An unexpected error occurred.");
      setStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {status === "success" && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Simulated Payment Succeeded!</p>
            <p className="text-sm text-emerald-700">Subscription activated. Redirecting you to billing page...</p>
          </div>
        </div>
      )}

      {status === "failed" && (
        <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Payment Failed</p>
            <p className="text-sm text-rose-700">{errorMessage || "Simulated gateway error."}</p>
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-500 mb-2">
        Click a button below to simulate the customer action at checkout.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => handleSimulate(true)}
          disabled={loading || status === "success"}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
        >
          <CreditCard className="w-5 h-5" />
          {loading ? "Processing..." : "Simulate Success"}
        </button>

        <button
          onClick={() => handleSimulate(false)}
          disabled={loading || status === "success"}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
        >
          <AlertCircle className="w-5 h-5" />
          {loading ? "Processing..." : "Simulate Failure"}
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        Sandbox Environment • Secure 256-bit encryption
      </div>
    </div>
  );
}
