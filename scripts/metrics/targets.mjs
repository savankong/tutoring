// The $20K/mo financial model's headline numbers, transcribed from the
// wiki "Financial Model — $20K/mo Plan" doc (source: Savan's Google Sheet,
// linked from that doc). That sheet is the actual source of truth and can
// change independently of this file — re-check it if these numbers look
// stale, and update both places together.
//
// "At today's inputs: blended pass price $24.49, needs ~817 passes and
// ~32,700 visitors/month (at a 2.5% purchase rate) to hit $20K, netting
// roughly $16,360/month profit after COGS, Stripe fees, and fixed costs."
export const MONTHLY_TARGETS = {
  revenueGoalUsd: 20000,
  blendedPassPriceUsd: 24.49,
  passesNeeded: 817,
  visitorsNeeded: 32700,
  purchaseRate: 0.025,
  netProfitUsd: 16360,
};

// Weekly targets are the monthly targets spread evenly across a 4.345-week
// month (365.25 / 7 / 12) — a simplification (real traffic isn't flat
// week to week), but good enough for "are we roughly on pace" tracking.
const WEEKS_PER_MONTH = 4.345;

export const WEEKLY_TARGETS = {
  passesNeeded: MONTHLY_TARGETS.passesNeeded / WEEKS_PER_MONTH,
  visitorsNeeded: MONTHLY_TARGETS.visitorsNeeded / WEEKS_PER_MONTH,
};
