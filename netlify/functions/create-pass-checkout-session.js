import Stripe from 'stripe';
import { getDatabase } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';
import { PASSES } from '../lib/plans.js';

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
    // no body is fine — falls through to the "unknown pass" error below
  }

  const pass = PASSES[body?.pass];
  if (!pass) return jsonResponse(400, { error: 'Unknown pass.' });

  const priceId = process.env[pass.priceEnvVar];
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!priceId || !secretKey) {
    return jsonResponse(500, { error: 'Billing is not configured yet.' });
  }

  const stripe = new Stripe(secretKey);
  const origin = new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Managed Payments requires a tax_code on every Product, which ours
      // don't have — opt out per-session (see create-checkout-session.js).
      managed_payments: { enabled: false },
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      customer: user.stripe_customer_id || undefined,
      customer_email: user.stripe_customer_id ? undefined : user.email,
      metadata: {
        type: 'pass_purchase',
        user_id: user.id,
        pass_type: pass.key,
        captures_cap: String(pass.captureCap),
        duration_hours: String(pass.durationHours),
      },
      success_url: `${origin}/account?pass=success`,
      cancel_url: `${origin}/account?pass=cancel`,
    });
    return jsonResponse(200, { url: session.url });
  } catch (err) {
    console.error('create-pass-checkout-session error:', err);
    return jsonResponse(500, { error: 'Could not start checkout.' });
  }
};
