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
    features: ['20 captures a month', 'Photo capture + AI answers', 'Answer history'],
    cta: 'Start for free',
  },
  {
    key: 'personal',
    name: 'Personal',
    price: '$9',
    period: '/month',
    tagline: 'Ready for daily tutoring sessions',
    features: [
      'Everything in Free, plus:',
      '200 captures a month',
      'Grace buffer before overage billing',
      'Priority email support',
    ],
    cta: 'Get started',
    featured: true,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$20',
    period: '/month',
    tagline: 'For high-volume tutors',
    features: ['Everything in Personal, plus:', '600 captures a month', 'Larger grace buffer', 'Priority support'],
    cta: 'Get started',
  },
  {
    key: 'team',
    name: 'Team',
    price: 'Custom',
    period: 'contact us',
    tagline: 'Multiple tutors, one account',
    features: ['Everything in Pro, plus:', 'Multiple tutor seats', 'Centralized billing', 'Dedicated support'],
    cta: 'Contact sales',
  },
];
