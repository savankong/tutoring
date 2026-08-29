import Stripe from 'stripe';
import { getDatabase } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';

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

  if (!user.stripe_customer_id) {
    return jsonResponse(400, { error: 'No billing account yet — subscribe first.' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return jsonResponse(500, { error: 'Billing is not configured yet.' });
  }

  const stripe = new Stripe(secretKey);
  const origin = new URL(request.url).origin;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${origin}/account`,
    });
    return jsonResponse(200, { url: session.url });
  } catch (err) {
    console.error('create-portal-session error:', err);
    return jsonResponse(500, { error: 'Could not open the billing portal.' });
  }
};
