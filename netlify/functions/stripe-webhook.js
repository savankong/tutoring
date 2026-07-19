import Stripe from 'stripe';
import { getDatabase } from '@netlify/database';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function mapStripeStatus(stripeStatus) {
  if (stripeStatus === 'active' || stripeStatus === 'trialing') return 'active';
  if (stripeStatus === 'past_due' || stripeStatus === 'unpaid' || stripeStatus === 'incomplete') {
    return 'past_due';
  }
  // canceled, incomplete_expired, paused, or anything unrecognized: deny access by default.
  return 'canceled';
}

export default async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const secretKey = Netlify.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Netlify.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secretKey || !webhookSecret) {
    return jsonResponse(500, { error: 'Billing is not configured yet.' });
  }

  const signature = request.headers.get('stripe-signature');
  const rawBody = await request.text();

  const stripe = new Stripe(secretKey);
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('stripe-webhook signature verification failed:', err.message);
    return jsonResponse(400, { error: 'Invalid signature' });
  }

  const db = getDatabase();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.client_reference_id;
      if (userId && session.customer) {
        await db.sql`
          UPDATE users
          SET stripe_customer_id = ${session.customer},
              stripe_subscription_id = ${session.subscription},
              subscription_status = 'active'
          WHERE id = ${userId}
        `;
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      await db.sql`
        UPDATE users
        SET subscription_status = ${mapStripeStatus(subscription.status)},
            stripe_subscription_id = ${subscription.id}
        WHERE stripe_customer_id = ${subscription.customer}
      `;
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await db.sql`
        UPDATE users
        SET subscription_status = 'canceled'
        WHERE stripe_customer_id = ${subscription.customer}
      `;
      break;
    }
    default:
      break;
  }

  return jsonResponse(200, { received: true });
};
