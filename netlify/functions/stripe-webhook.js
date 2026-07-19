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

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
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
        let currentPeriodStart = null;
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
        } catch (err) {
          console.error('Could not retrieve subscription for period start:', err);
        }
        await db.sql`
          UPDATE users
          SET stripe_customer_id = ${session.customer},
              stripe_subscription_id = ${session.subscription},
              subscription_status = 'active',
              current_period_start = ${currentPeriodStart}
          WHERE id = ${userId}
        `;
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
      await db.sql`
        UPDATE users
        SET subscription_status = ${mapStripeStatus(subscription.status)},
            stripe_subscription_id = ${subscription.id},
            current_period_start = ${currentPeriodStart}
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
