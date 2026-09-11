// Pulls yesterday's (UTC) revenue/billing-health signals: MRR (from Stripe,
// live subscription state), plus pass revenue by SKU, credit-pack revenue,
// and capture volume (from our own DB — see netlify/database/migrations —
// which is more reliable than reconstructing it from Stripe checkout
// session metadata, since it's exactly what stripe-webhook.js already wrote
// on confirmed payment). Refunds and failed payments come from Stripe,
// since those aren't mirrored into our DB anywhere.
//
// NOT VERIFIED against a live Stripe account — this environment has no
// live Stripe credentials (same caveat scripts/migrate-subscribers-to-new-pricing.mjs
// already carries). The Stripe API shapes used here (subscriptions.list,
// charges.list) are standard/stable, but run this by hand against a real
// key and sanity-check the numbers before trusting the nightly cron.
import Stripe from 'stripe';
import { connectDb } from './lib/db.mjs';

function dayRange(dateStr) {
  const start = Math.floor(new Date(`${dateStr}T00:00:00Z`).getTime() / 1000);
  const end = start + 86400;
  return { start, end };
}

async function pullStripeDay(dateStr, stripeSecretKey = process.env.STRIPE_SECRET_KEY) {
  if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY is not set.');
  const stripe = new Stripe(stripeSecretKey);
  const { start, end } = dayRange(dateStr);

  // MRR: sum of the recurring amount on every active/trialing subscription's
  // first item. A point-in-time snapshot (today's MRR, not "MRR on dateStr")
  // — Stripe doesn't offer historical MRR directly, and the daily delta is
  // more informative for the weekly review than a same-value-every-day figure.
  let mrrCents = 0;
  let activeSubscriptions = 0;
  for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100 })) {
    const item = sub.items.data[0];
    if (item?.price?.unit_amount) {
      mrrCents += item.price.unit_amount * (item.quantity ?? 1);
      activeSubscriptions += 1;
    }
  }

  let refundedCents = 0;
  let failedPaymentsCount = 0;
  for await (const charge of stripe.charges.list({ created: { gte: start, lt: end }, limit: 100 })) {
    refundedCents += charge.amount_refunded ?? 0;
    if (charge.status === 'failed') failedPaymentsCount += 1;
  }

  const db = await connectDb();
  try {
    const [{ rows: capturesRows }, { rows: passRows }, { rows: creditRows }] = await Promise.all([
      db.query('SELECT count(*)::int AS count FROM captures WHERE created_at >= $1 AND created_at < $2', [new Date(start * 1000), new Date(end * 1000)]),
      db.query(
        `SELECT pass_type, count(*)::int AS purchases, coalesce(sum(amount_cents), 0)::int AS revenue_cents
         FROM pass_purchases WHERE purchased_at >= $1 AND purchased_at < $2 GROUP BY pass_type`,
        [new Date(start * 1000), new Date(end * 1000)],
      ),
      db.query(
        `SELECT count(*)::int AS purchases, coalesce(sum(amount_cents), 0)::int AS revenue_cents
         FROM credit_purchases WHERE created_at >= $1 AND created_at < $2`,
        [new Date(start * 1000), new Date(end * 1000)],
      ),
    ]);

    return {
      mrrUsd: mrrCents / 100,
      activeSubscriptions,
      refundedUsd: refundedCents / 100,
      failedPaymentsCount,
      capturesCount: capturesRows[0].count,
      passRevenueBySku: Object.fromEntries(passRows.map((r) => [r.pass_type, { purchases: r.purchases, revenueUsd: r.revenue_cents / 100 }])),
      creditPackRevenueUsd: creditRows[0].revenue_cents / 100,
      creditPackPurchases: creditRows[0].purchases,
    };
  } finally {
    await db.end();
  }
}

export { pullStripeDay };

if (import.meta.url === `file://${process.argv[1]}`) {
  const date = process.argv[2] ?? new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  pullStripeDay(date)
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
