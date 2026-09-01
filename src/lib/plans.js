// Display-only mirror of netlify/lib/plans.js — kept separate so backend
// billing logic never ships into the client bundle. Keys must match
// PLANS/PASSES in netlify/lib/plans.js. Prices updated 2026-08-30.
export const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'Try it out, no card required',
    features: ['5 captures a month', 'Photo capture + AI answers', 'Answer history'],
    cta: 'Start for free',
  },
  {
    key: 'starter',
    name: 'Starter',
    price: '$9.99',
    period: '/month',
    tagline: 'A cheap way to go beyond Free',
    features: ['Everything in Free, plus:', '100 captures a month', 'Grace buffer, then buy credits as needed', 'Priority email support'],
    cta: 'Get started',
  },
  {
    key: 'personal',
    name: 'Personal',
    price: '$19.99',
    period: '/month',
    tagline: 'Ready for daily tutoring sessions',
    features: [
      'Everything in Starter, plus:',
      '200 captures a month',
      'Larger grace buffer',
      'Priority email support',
    ],
    cta: 'Get started',
    featured: true,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$39.99',
    period: '/month',
    tagline: 'For high-volume tutors',
    features: ['Everything in Personal, plus:', '400 captures a month', 'Largest grace buffer', 'Priority support'],
    cta: 'Get started',
  },
];

// Add-on credit pack — buyable by any paid-plan subscriber once they run
// past their cap + grace buffer. Rolls over indefinitely while on a paid
// plan; forfeited on downgrade to Free. Unchanged in the 2026-08-30 update.
export const CREDIT_PACK_SIZE = 100;
export const CREDIT_PACK_PRICE = '$15.00';
export const CREDIT_PACK_PRICE_CENTS = 1500;

// Invite-a-friend reward — mirrors the backend's netlify/lib/plans.js.
export const INVITE_REWARD_CREDITS = 15;

// One-time capture passes — added 2026-08-30. No account required to
// picture how these differ from a plan: a real wall-clock expiration, not a
// billing cycle, and a one-time charge, not a subscription. See the
// backend's netlify/lib/plans.js for the full rationale.
export const PASSES = [
  {
    key: 'cram_24h',
    name: '24-Hour Cram Pass',
    price: '$7.99',
    captureCap: 40,
    duration: '24 hours',
    tagline: 'One focused session, gone by tomorrow.',
    cta: 'Get the pass',
  },
  {
    key: 'prep_7d',
    name: '7-Day Prep Pass',
    price: '$29.99',
    captureCap: 200,
    duration: '7 days',
    tagline: 'A week of runway before the real thing.',
    cta: 'Get the pass',
  },
  {
    key: 'unlimited_30d',
    name: '30-Day Unlimited Pass',
    price: '$59.99',
    captureCap: 500,
    duration: '30 days',
    tagline: 'A full month, no subscription attached.',
    cta: 'Get the pass',
  },
];
