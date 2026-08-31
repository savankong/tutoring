import Stripe from 'stripe';
import { getDatabase } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';
import { PLANS } from '../lib/plans.js';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const db = getDatabase();
  const user = await requireUser(request, db);
  if (!user) return jsonResponse(401, { error: 'Not signed in.' });

  let body = {};
  try {
    body = await request.json();
  } catch {
    // no body is fine — falls back to the default plan below
  }

  const planKey = PLANS[body?.plan]?.priceEnvVar ? body.plan : 'personal';
  const plan = PLANS[planKey];
  const priceId = process.env[plan.priceEnvVar] || process.env.STRIPE_PRICE_ID;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!priceId || !secretKey) {
    return jsonResponse(500, { error: 'Billing is not configured yet.' });
  }

  const stripe = new Stripe(secretKey);
  const origin = new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      // Managed Payments (Stripe's merchant-of-record tax handling) is on by
      // default for this account and requires a tax_code on every Product,
      // which none of ours have — opt out per-session instead of setting tax
      // codes, so Cambo keeps handling its own sales tax like before.
      managed_payments: { enabled: false },
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/account?checkout=cancel`,
    });
    return jsonResponse(200, { url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return jsonResponse(500, { error: 'Could not start checkout.' });
  }
};
