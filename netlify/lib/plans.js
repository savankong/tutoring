// Netlify-style tier ladder: a permanent free tier plus paid tiers that
// unlock a higher capture cap, a grace buffer, and metered overage instead
// of a hard block. Team/Enterprise has no Stripe price — it's a contact-sales
// tier handled entirely on the pricing page, same as Netlify's own Enterprise.
export const PLANS = {
  free: {
    key: 'free',
    name: 'Free',
    priceLabel: '$0',
    periodLabel: 'forever',
    tagline: 'Try it out, no card required',
    captureCap: 20,
    graceBuffer: 0,
    overageAllowed: false,
    priceEnvVar: null,
    features: ['20 captures a month', 'Photo capture + AI answers', 'Answer history'],
  },
  personal: {
    key: 'personal',
    name: 'Personal',
    priceLabel: '$9',
    periodLabel: '/month',
    tagline: 'Ready for daily tutoring sessions',
    captureCap: 200,
    graceBuffer: 20,
    overageAllowed: true,
    priceEnvVar: 'STRIPE_PRICE_PERSONAL',
    features: ['Everything in Free, plus:', '200 captures a month', 'Grace buffer before overage billing', 'Priority email support'],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    priceLabel: '$20',
    periodLabel: '/month',
    tagline: 'For high-volume tutors',
    captureCap: 600,
    graceBuffer: 30,
    overageAllowed: true,
    priceEnvVar: 'STRIPE_PRICE_PRO',
    features: ['Everything in Personal, plus:', '600 captures a month', 'Larger grace buffer', 'Priority support'],
  },
};

export const PLAN_ORDER = ['free', 'personal', 'pro'];

// Flat per-capture overage rate across every paid tier — same shape as
// Netlify pricing metered add-ons the same regardless of which base plan
// you're on.
export const OVERAGE_UNIT_CENTS = 12;

export function planFor(user) {
  return PLANS[user?.plan] || PLANS.free;
}

// The legacy single $15/month price predates the tier ladder. Its shape is
// identical to Personal (200 cap + 20 grace + overage), so existing
// subscribers on it are treated as Personal without touching their Stripe
// subscription.
export function planKeyForPriceId(priceId) {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PERSONAL || priceId === process.env.STRIPE_PRICE_ID) {
    return 'personal';
  }
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  return null;
}
