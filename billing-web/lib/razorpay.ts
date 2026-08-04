import Razorpay from 'razorpay';
import crypto from 'crypto';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Determine if we should run in simulation mode
export const isSimulationMode =
  !keyId ||
  !keySecret ||
  keyId.trim() === '' ||
  keySecret.trim() === '' ||
  keyId.startsWith('your-') ||
  keyId.startsWith('dummy') ||
  keySecret.startsWith('your-') ||
  keySecret.startsWith('dummy');

class MockRazorpayPlans {
  async create(data: any) {
    const planId = `plan_${Math.random().toString(36).substring(2, 10)}`;
    return {
      id: planId,
      entity: 'plan',
      interval: data.interval === 1 ? 1 : data.interval,
      period: data.period, // 'monthly' | 'yearly'
      item: {
        name: data.item.name,
        amount: data.item.amount,
        currency: data.item.currency || 'INR',
        description: data.item.description || '',
      },
      created_at: Math.floor(Date.now() / 1000),
    };
  }
}

class MockRazorpaySubscriptions {
  async create(data: any) {
    const subId = `sub_${Math.random().toString(36).substring(2, 10)}`;
    const trialDays = data.start_at ? Math.max(0, Math.floor((data.start_at - (Date.now() / 1000)) / (24 * 60 * 60))) : 0;
    
    return {
      id: subId,
      entity: 'subscription',
      plan_id: data.plan_id,
      status: data.start_at && data.start_at > Date.now() / 1000 ? 'authenticated' : 'created',
      current_start: Math.floor(Date.now() / 1000),
      current_end: data.start_at || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      ended_at: null,
      quantity: data.quantity || 1,
      notes: data.notes || {},
      charge_at: null,
      start_at: data.start_at || null,
      total_count: data.total_count || 12,
      paid_count: 0,
      remaining_count: data.total_count || 12,
      short_url: `/settings/billing/checkout?subscription_id=${subId}`,
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  async cancel(subId: string, cancelAtCycleEnd: boolean) {
    return {
      id: subId,
      entity: 'subscription',
      status: cancelAtCycleEnd ? 'active' : 'cancelled',
      cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
      canceled_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    };
  }

  async fetch(subId: string) {
    return {
      id: subId,
      entity: 'subscription',
      plan_id: 'plan_dummy',
      status: 'active',
      current_start: Math.floor(Date.now() / 1000),
      current_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      short_url: `/settings/billing/checkout?subscription_id=${subId}`,
    };
  }
}

class MockRazorpay {
  plans = new MockRazorpayPlans();
  subscriptions = new MockRazorpaySubscriptions();
}

// Get the razorpay client
const razorpayClient = isSimulationMode
  ? (new MockRazorpay() as unknown as Razorpay)
  : new Razorpay({
      key_id: keyId!,
      key_secret: keySecret!,
    });

export default razorpayClient;

// S3: in production, a missing/dummy Razorpay configuration must NEVER silently mock the payment
// flow — the mock client would "succeed" (subscriptions created, invoices minted) without ever
// charging anyone, and unsigned webhooks would be accepted. Call this at the top of any billing
// action that touches the Razorpay API so a misconfigured production deploy fails loudly instead
// of faking payments. Development simulation (no keys, NODE_ENV !== 'production') is unaffected.
export function assertRazorpayConfigured() {
  if (isSimulationMode && process.env.NODE_ENV === "production") {
    throw new Error(
      "Payment provider is not configured. Set real Razorpay keys (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) before enabling billing in production."
    );
  }
}

// Verification helper
export function verifyRazorpayWebhook(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (isSimulationMode) {
    return true; // Bypass in simulation/mock mode
  }
  if (!secret) {
    // Live Razorpay keys are configured but RAZORPAY_WEBHOOK_SECRET is not — reject rather than
    // silently accepting unsigned webhooks (a prior fallback here treated a missing secret as an
    // automatic pass, which would accept forged payment webhooks in production).
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    return false;
  }
}
