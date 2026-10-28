// Single source of truth for the loyalty programme. Every path that earns or redeems points (POS
// sale, invoice edit, online order completion, merchant approval) and every screen that displays
// a balance must use these — online completions previously earned at ₹10/point while the POS
// earned at ₹100/point, so the same spend was worth 10× more points online.

// 1 loyalty point = ₹1 of discount when redeemed.
export const LOYALTY_POINT_VALUE = 1;
// 1 point earned per ₹100 of net spend.
export const LOYALTY_EARN_RATE = 100;

export function loyaltyPointsFor(netAmount: number): number {
  return Math.max(0, Math.floor(netAmount / LOYALTY_EARN_RATE));
}
