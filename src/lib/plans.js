// Display-only mirror of netlify/lib/plans.js — kept separate so backend
// billing logic never ships into the client bundle. Keys must match
// PLANS in netlify/lib/plans.js.
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
    price: '$4.99',
    period: '/month',
    tagline: 'A cheap way to go beyond Free',
    features: ['Everything in Free, plus:', '45 captures a month', 'Grace buffer, then buy credits as needed', 'Priority email support'],
    cta: 'Get started',
  },
  {
    key: 'personal',
    name: 'Personal',
    price: '$9.99',
    period: '/month',
    tagline: 'Ready for daily tutoring sessions',
    features: [
      'Everything in Starter, plus:',
      '90 captures a month',
      'Larger grace buffer',
      'Priority email support',
    ],
    cta: 'Get started',
    featured: true,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$19.99',
    period: '/month',
    tagline: 'For high-volume tutors',
    features: ['Everything in Personal, plus:', '180 captures a month', 'Largest grace buffer', 'Priority support'],
    cta: 'Get started',
  },
];

// Add-on credit pack — buyable by any paid-plan subscriber once they run
// past their cap + grace buffer. Rolls over indefinitely while on a paid
// plan; forfeited on downgrade to Free.
export const CREDIT_PACK_SIZE = 100;
export const CREDIT_PACK_PRICE = '$15.00';
export const CREDIT_PACK_PRICE_CENTS = 1500;
