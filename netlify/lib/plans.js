// Tier ladder: a permanent free tier plus paid tiers that
// unlock a higher capture cap and a grace buffer. Once a paid user runs past
// cap + grace, further captures draw down their purchased credit balance
// instead of triggering automatic overage billing — see CREDIT_PACK_* below
// and netlify/lib/access.js.
//
// Cap + grace on every paid tier is sized so that even worst-case per-capture
// cost (large gallery image + hardest reasoning, ~$0.075/capture at
// claude-opus-4-8 rates) stays under ~75% of the plan price at the cap alone
// (grace sits on top of that, at the same rate: 100*0.075/9.99=75.1%,
// 200*0.075/19.99=75.0%, 400*0.075/39.99=75.0% — verified against the
// 2026-08-30 pricing update below, so the ceiling still holds).
export const PLANS = {
  free: {
    key: 'free',
    name: 'Free',
    priceLabel: '$0',
    periodLabel: 'forever',
    tagline: 'Try it out, no card required',
    captureCap: 5,
    graceBuffer: 0,
    creditsAllowed: false,
    priceEnvVar: null,
    features: ['5 captures a month', 'Photo capture + AI answers', 'Answer history'],
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    priceLabel: '$9.99',
    periodLabel: '/month',
    tagline: 'A cheap way to go beyond Free',
    captureCap: 100,
    graceBuffer: 10,
    creditsAllowed: true,
    priceEnvVar: 'STRIPE_PRICE_STARTER',
    features: ['Everything in Free, plus:', '100 captures a month', 'Grace buffer, then buy credits as needed', 'Priority email support'],
  },
  personal: {
    key: 'personal',
    name: 'Personal',
    priceLabel: '$19.99',
    periodLabel: '/month',
    tagline: 'Ready for daily tutoring sessions',
    captureCap: 200,
    graceBuffer: 20,
    creditsAllowed: true,
    priceEnvVar: 'STRIPE_PRICE_PERSONAL',
    features: ['Everything in Starter, plus:', '200 captures a month', 'Larger grace buffer', 'Priority email support'],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    priceLabel: '$39.99',
    periodLabel: '/month',
    tagline: 'For high-volume tutors',
    captureCap: 400,
    graceBuffer: 40,
    creditsAllowed: true,
    priceEnvVar: 'STRIPE_PRICE_PRO',
    features: ['Everything in Personal, plus:', '400 captures a month', 'Largest grace buffer', 'Priority support'],
  },
  // Admin-granted only — never sold, no Stripe price, not shown on the
  // public pricing page (absent from src/lib/plans.js on purpose).
  // captureCap: Infinity makes isCapped() in access.js always false, and
  // creditsAllowed: false means captures never draw down a credit balance
  // either — a true "no cap, no credits needed" comp tier.
  unlimited: {
    key: 'unlimited',
    name: 'Unlimited',
    priceLabel: 'Comp',
    periodLabel: '',
    tagline: 'Admin-granted — no cap, no credits needed',
    captureCap: Infinity,
    graceBuffer: 0,
    creditsAllowed: false,
    priceEnvVar: null,
    features: ['Unlimited captures', 'No credits required', 'Admin-granted only'],
  },
};

export const PLAN_ORDER = ['free', 'starter', 'personal', 'pro'];

// Add-on credits: the profit center. 1 credit = 1 capture beyond a paid
// plan's cap + grace buffer. Priced above the old $0.12/capture legacy
// overage rate on purpose — credits are prepaid and roll over indefinitely
// while the user stays on a paid plan, so the premium buys predictability,
// not just capacity. Margin stays >=50% even at worst-case per-capture cost.
// Unchanged in the 2026-08-30 pricing update.
export const CREDIT_PACK_SIZE = 100;
export const CREDIT_PACK_PRICE_CENTS = 1500;
export const CREDIT_PACK_PRICE_ENV_VAR = 'STRIPE_PRICE_CREDIT_PACK';

// One-time, non-recurring capture passes — added 2026-08-30. A separate
// capacity pool from the monthly plan cap: time-limited instead of
// period-limited (a real wall-clock expiration, not tied to a billing
// cycle), bought with a one-time Stripe payment (mode: "payment", not
// "subscription"). See netlify/lib/access.js for how a pass is consumed —
// it's drawn down before plan cap/grace/credits on every capture, since an
// unused pass capture just expires and is wasted, unlike plan cap (which
// regenerates every period) or credits (which roll over indefinitely on a
// paid plan). `durationHours` is applied at webhook time (now() + duration),
// not at checkout-session-creation time, so the clock starts on actual
// payment, not on however long the customer sits on the Stripe Checkout page.
export const PASSES = {
  cram_24h: {
    key: 'cram_24h',
    name: '24-Hour Cram Pass',
    priceLabel: '$9.99',
    priceCents: 999,
    captureCap: 40,
    durationHours: 24,
    tagline: 'One focused session, gone by tomorrow.',
    priceEnvVar: 'STRIPE_PRICE_PASS_24H',
  },
  prep_7d: {
    key: 'prep_7d',
    name: '7-Day Prep Pass',
    priceLabel: '$29.99',
    priceCents: 2999,
    captureCap: 200,
    durationHours: 24 * 7,
    tagline: 'A week of runway before the real thing.',
    priceEnvVar: 'STRIPE_PRICE_PASS_7D',
  },
  unlimited_30d: {
    key: 'unlimited_30d',
    name: '30-Day Unlimited Pass',
    priceLabel: '$59.99',
    priceCents: 5999,
    captureCap: 500,
    durationHours: 24 * 30,
    tagline: 'A full month, no subscription attached.',
    priceEnvVar: 'STRIPE_PRICE_PASS_30D',
  },
};

export const PASS_ORDER = ['cram_24h', 'prep_7d', 'unlimited_30d'];

// Flat per-capture overage rate honored only for pre-existing subscribers on
// the legacy $15/month price — new overage billing no longer happens (see
// analyze-question.js), but this constant stays for reference/audit.
export const OVERAGE_UNIT_CENTS = 12;

export function planFor(user) {
  return PLANS[user?.plan] || PLANS.free;
}

// The legacy single $15/month price predates the tier ladder. Its shape is
// closest to Personal, so existing subscribers on it are treated as Personal
// (now 200 cap + 20 grace) without touching their Stripe subscription.
export function planKeyForPriceId(priceId) {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PERSONAL || priceId === process.env.STRIPE_PRICE_ID) {
    return 'personal';
  }
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  return null;
}
