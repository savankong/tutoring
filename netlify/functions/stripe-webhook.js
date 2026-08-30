import Stripe from 'stripe';
import { getDatabase } from '../lib/db.js';
import { planKeyForPriceId } from '../lib/plans.js';

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

      if (session.mode === 'payment' && session.metadata?.type === 'credit_purchase') {
        const userId = session.metadata.user_id;
        const credits = parseInt(session.metadata.credits, 10);
        if (userId && Number.isFinite(credits) && credits > 0) {
          // ON CONFLICT DO NOTHING makes this idempotent — if Stripe retries
          // the event, the second insert is skipped and the balance isn't
          // double-credited.
          const [inserted] = await db.sql`
            INSERT INTO credit_purchases (user_id, stripe_checkout_session_id, credits, amount_cents)
            VALUES (${userId}, ${session.id}, ${credits}, ${session.amount_total ?? 0})
            ON CONFLICT (stripe_checkout_session_id) DO NOTHING
            RETURNING id
          `;
          if (inserted) {
            await db.sql`UPDATE users SET credit_balance = credit_balance + ${credits} WHERE id = ${userId}`;
          }
        }
        break;
      }

      if (session.mode === 'payment' && session.metadata?.type === 'pass_purchase') {
        const userId = session.metadata.user_id;
        const passType = session.metadata.pass_type;
        const capturesCap = parseInt(session.metadata.captures_cap, 10);
        const durationHours = parseInt(session.metadata.duration_hours, 10);
        if (userId && passType && Number.isFinite(capturesCap) && Number.isFinite(durationHours)) {
          // expires_at is computed here, at purchase confirmation, not at
          // checkout-session creation — the clock starts on actual payment,
          // not on however long the customer sat on the Stripe Checkout
          // page. ON CONFLICT DO NOTHING makes this idempotent against
          // Stripe retries, same as the credit-purchase branch above.
          await db.sql`
            INSERT INTO pass_purchases (user_id, pass_type, captures_cap, amount_cents, stripe_checkout_session_id, expires_at)
            VALUES (
              ${userId}, ${passType}, ${capturesCap}, ${session.amount_total ?? 0}, ${session.id},
              now() + make_interval(hours => ${durationHours})
            )
            ON CONFLICT (stripe_checkout_session_id) DO NOTHING
          `;
        }
        break;
      }

      const userId = session.client_reference_id;
      if (userId && session.customer) {
        let currentPeriodStart = null;
        let plan = 'personal';
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
          plan = planKeyForPriceId(subscription.items.data[0]?.price?.id) || 'personal';
        } catch (err) {
          console.error('Could not retrieve subscription for period start:', err);
        }
        await db.sql`
          UPDATE users
          SET stripe_customer_id = ${session.customer},
              stripe_subscription_id = ${session.subscription},
              subscription_status = 'active',
              current_period_start = ${currentPeriodStart},
              plan = ${plan}
          WHERE id = ${userId}
        `;
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
      const plan = planKeyForPriceId(subscription.items.data[0]?.price?.id) || 'personal';
      await db.sql`
        UPDATE users
        SET subscription_status = ${mapStripeStatus(subscription.status)},
            stripe_subscription_id = ${subscription.id},
            current_period_start = ${currentPeriodStart},
            plan = ${plan}
        WHERE stripe_customer_id = ${subscription.customer}
      `;
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      // Cancellation drops back to Free rather than cutting off access
      // entirely — same as Netlify: stop paying, keep a capped free tier.
      // Purchased credits are a paid-plan perk (they roll over "as long as
      // you remain on a paid plan"), so they're forfeited on downgrade.
      await db.sql`
        UPDATE users
        SET subscription_status = 'canceled',
            plan = 'free',
            credit_balance = 0
        WHERE stripe_customer_id = ${subscription.customer}
      `;
      break;
    }
    default:
      break;
  }

  return jsonResponse(200, { received: true });
};
