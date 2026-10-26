import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { isSimulationMode } from "@/lib/razorpay";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default async function CheckoutPage(props: {
  searchParams: Promise<{ subscription_id?: string; success?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return notFound();
  }

  const searchParams = await props.searchParams;
  const subId = searchParams.subscription_id;

  if (!subId) {
    // success=true is where a zero-amount (fully discounted / free) checkout lands, in real and
    // simulated mode alike.
    if (searchParams.success === "true") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-3xl font-bold mb-4">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
          <p className="text-gray-500 mt-2">Your subscription has been activated.</p>
          <a
            href="/settings/billing"
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium text-sm transition-colors"
          >
            Back to Billing
          </a>
        </div>
      );
    }
    return notFound();
  }

  // S3: everything below is the sandbox simulator that stands in for Razorpay's hosted checkout.
  // With real keys configured (or in a production deploy) Razorpay's own page is used instead, so
  // the simulator must not exist there.
  if (!isSimulationMode || process.env.NODE_ENV === "production") {
    return notFound();
  }

  // The mock Razorpay client's short_url carries the (mock) Razorpay subscription id, not our row id.
  const subscription = await prisma.tenantSubscription.findFirst({
    where: { OR: [{ id: subId }, { razorpaySubscriptionId: subId }] },
    include: {
      tenant: true,
      plan: true
    }
  });

  // Only the subscription's own tenant may open its checkout (previously any logged-in user could
  // load another tenant's subscription by id).
  if (!subscription || (session.user.role !== "SUPERADMIN" && subscription.tenantId !== session.user.tenantId)) {
    return notFound();
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-8 text-white text-center">
          <div className="text-sm font-semibold tracking-wider uppercase opacity-85">
            Razorpay Sandbox Simulator
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Secure Checkout</h1>
          <p className="text-indigo-200 mt-2 text-sm sm:text-base">
            Business: <span className="font-semibold text-white">{subscription.tenant.name}</span>
          </p>
        </div>

        {/* Order Details */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
            <h2 className="font-semibold text-gray-800 text-lg">Order Summary</h2>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600">Plan</span>
              <span className="font-semibold text-gray-900">{subscription.plan.name} ({subscription.plan.interval})</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600">Trial Period</span>
              <span className="text-gray-900 font-medium">{subscription.plan.trialDays} Days Free</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between text-base sm:text-lg font-bold">
              <span className="text-gray-950">Amount Due</span>
              <span className="text-indigo-600">₹{subscription.plan.amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Interactive Simulation Panel */}
          <CheckoutClient subscription={subscription} />
        </div>
      </div>
    </div>
  );
}
