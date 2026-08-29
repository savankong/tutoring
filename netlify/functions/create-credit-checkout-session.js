import Stripe from 'stripe';
import { getDatabase } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';
import { planFor, CREDIT_PACK_SIZE, CREDIT_PACK_PRICE_ENV_VAR } from '../lib/plans.js';

const MAX_PACKS_PER_PURCHASE = 20;

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

  const plan = planFor(user);
  if (!plan.creditsAllowed) {
    return jsonResponse(400, { error: 'Upgrade to a paid plan before buying credits.' });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // no body is fine — falls back to 1 pack below
  }

  const packs = Number.isInteger(body?.packs) ? body.packs : 1;
  if (packs < 1 || packs > MAX_PACKS_PER_PURCHASE) {
    return jsonResponse(400, { error: `Choose between 1 and ${MAX_PACKS_PER_PURCHASE} credit packs.` });
  }

  const priceId = process.env[CREDIT_PACK_PRICE_ENV_VAR];
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!priceId || !secretKey) {
    return jsonResponse(500, { error: 'Billing is not configured yet.' });
  }

  const stripe = new Stripe(secretKey);
  const origin = new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: packs }],
      client_reference_id: user.id,
      customer: user.stripe_customer_id || undefined,
      customer_email: user.stripe_customer_id ? undefined : user.email,
      metadata: {
        type: 'credit_purchase',
        user_id: user.id,
        credits: String(packs * CREDIT_PACK_SIZE),
      },
      success_url: `${origin}/account?credits=success`,
      cancel_url: `${origin}/account?credits=cancel`,
    });
    return jsonResponse(200, { url: session.url });
  } catch (err) {
    console.error('create-credit-checkout-session error:', err);
    return jsonResponse(500, { error: 'Could not start checkout.' });
  }
};
