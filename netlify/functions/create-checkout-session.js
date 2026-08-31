import Stripe from 'stripe';
import { getDatabase } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';
import { PLANS } from '../lib/plans.js';
import { planCheckoutSessionParams } from '../lib/checkout.js';

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
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const origin = new URL(request.url).origin;
  const params = planCheckoutSessionParams({ origin, planKey, userId: user.id, userEmail: user.email });
  if (!params || !secretKey) {
    return jsonResponse(500, { error: 'Billing is not configured yet.' });
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.create(params);
    return jsonResponse(200, { url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return jsonResponse(500, { error: 'Could not start checkout.' });
  }
};
