import Stripe from 'stripe';
import { getDatabase } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';
import { PASSES } from '../lib/plans.js';
import { passCheckoutSessionParams } from '../lib/checkout.js';

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

  if (!PASSES[body?.pass]) return jsonResponse(400, { error: 'Unknown pass.' });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const origin = new URL(request.url).origin;
  const params = passCheckoutSessionParams({
    origin,
    passKey: body.pass,
    userId: user.id,
    userEmail: user.email,
    stripeCustomerId: user.stripe_customer_id,
  });
  if (!params || !secretKey) {
    return jsonResponse(500, { error: 'Billing is not configured yet.' });
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.create(params);
    return jsonResponse(200, { url: session.url });
  } catch (err) {
    console.error('create-pass-checkout-session error:', err);
    return jsonResponse(500, { error: 'Could not start checkout.' });
  }
};
