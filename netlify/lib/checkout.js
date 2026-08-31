// Shared Stripe Checkout session creation, used by both the standalone
// create-*-checkout-session.js endpoints (an already-signed-in user
// upgrading from /pricing or /account) and google-oauth-callback.js (a
// brand-new-or-returning user completing signup+checkout in one round trip
// via Google). Keeping this in one place means both paths always agree on
// managed_payments, success/cancel URLs, and metadata shape.
import { PLANS, PASSES } from './plans.js';

export function planCheckoutSessionParams({ origin, planKey, userId, userEmail }) {
  const plan = PLANS[planKey];
  const priceId = plan && (process.env[plan.priceEnvVar] || process.env.STRIPE_PRICE_ID);
  if (!priceId) return null;
  return {
    mode: 'subscription',
    // Managed Payments requires a tax_code on every Product, which ours
    // don't have — opt out per-session (see create-checkout-session.js).
    managed_payments: { enabled: false },
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: userId,
    customer_email: userEmail,
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/account?checkout=cancel`,
  };
}

export function passCheckoutSessionParams({ origin, passKey, userId, userEmail, stripeCustomerId }) {
  const pass = PASSES[passKey];
  const priceId = pass && process.env[pass.priceEnvVar];
  if (!priceId) return null;
  return {
    mode: 'payment',
    managed_payments: { enabled: false },
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: userId,
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : userEmail,
    metadata: {
      type: 'pass_purchase',
      user_id: userId,
      pass_type: pass.key,
      captures_cap: String(pass.captureCap),
      duration_hours: String(pass.durationHours),
    },
    success_url: `${origin}/account?pass=success`,
    cancel_url: `${origin}/account?pass=cancel`,
  };
}
