// Migrates existing active Stripe subscribers onto the 2026-08-30 pricing
// (Starter $4.99->$9.99, Personal $9.99->$19.99, Pro $19.99->$39.99).
//
// PREREQUISITE: the new Stripe Price objects must already exist (Stripe
// Prices are immutable — you can't edit an existing $4.99 Price to charge
// $9.99, you create a new Price object). Create them in the Stripe
// dashboard first (live mode), then set STRIPE_PRICE_STARTER /
// STRIPE_PRICE_PERSONAL / STRIPE_PRICE_PRO (in the DO dashboard, and for
// running this script) to the NEW Price IDs. This script reads those env
// vars as the migration TARGET.
//
// It needs the OLD Price IDs too, as the migration SOURCE, passed
// separately (OLD_STRIPE_PRICE_STARTER etc.) — once you overwrite the env
// vars with the new IDs, the old ones only survive in the Stripe dashboard's
// price history or your own notes, not in this codebase.
//
// SAFE BY DEFAULT: dry-run unless you pass --execute. Always run without
// --execute first and read the output before adding it.
//
// Proration: defaults to proration_behavior "none" — the new price takes
// effect at the customer's next renewal, no immediate surprise charge for
// the increase. Pass --prorate-now for "create_prorations" (bills/credits
// the difference immediately) instead. This default was chosen because it's
// the lower-risk option for a price *increase* on existing customers — an
// unannounced immediate charge is the kind of thing that generates support
// tickets and chargebacks. Confirm which behavior you actually want before
// running with --execute; this is a real, immediate, unannounced-to-the-
// customer change to their subscription either way, so consider whether
// they should hear about it from you first.
//
// Usage:
//   DATABASE_URL=postgres://... \
//   STRIPE_SECRET_KEY=sk_live_... \
//   STRIPE_PRICE_STARTER=price_NEW_starter STRIPE_PRICE_PERSONAL=price_NEW_personal STRIPE_PRICE_PRO=price_NEW_pro \
//   OLD_STRIPE_PRICE_STARTER=price_OLD_starter OLD_STRIPE_PRICE_PERSONAL=price_OLD_personal OLD_STRIPE_PRICE_PRO=price_OLD_pro \
//   [OLD_STRIPE_PRICE_ID=price_OLD_legacy_15] \
//   node scripts/migrate-subscribers-to-new-pricing.mjs [--execute] [--prorate-now]

import pg from 'pg';
import Stripe from 'stripe';

const EXECUTE = process.argv.includes('--execute');
const PRORATE_NOW = process.argv.includes('--prorate-now');

// Same DO Managed PostgreSQL SSL quirk documented in scripts/migrate-db.mjs.
function stripSslMode(connectionString) {
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  return url.toString();
}

async function main() {
  const {
    DATABASE_URL,
    STRIPE_SECRET_KEY,
    STRIPE_PRICE_STARTER,
    STRIPE_PRICE_PERSONAL,
    STRIPE_PRICE_PRO,
    OLD_STRIPE_PRICE_STARTER,
    OLD_STRIPE_PRICE_PERSONAL,
    OLD_STRIPE_PRICE_PRO,
    OLD_STRIPE_PRICE_ID, // legacy $15/mo price, optional
  } = process.env;

  if (!DATABASE_URL || !STRIPE_SECRET_KEY) {
    console.error('DATABASE_URL and STRIPE_SECRET_KEY are required.');
    process.exit(1);
  }
  if (!STRIPE_PRICE_STARTER || !STRIPE_PRICE_PERSONAL || !STRIPE_PRICE_PRO) {
    console.error('STRIPE_PRICE_STARTER / STRIPE_PRICE_PERSONAL / STRIPE_PRICE_PRO (the NEW price IDs) are required.');
    process.exit(1);
  }
  if (!OLD_STRIPE_PRICE_STARTER || !OLD_STRIPE_PRICE_PERSONAL || !OLD_STRIPE_PRICE_PRO) {
    console.error('OLD_STRIPE_PRICE_STARTER / OLD_STRIPE_PRICE_PERSONAL / OLD_STRIPE_PRICE_PRO (the OLD price IDs) are required.');
    process.exit(1);
  }

  const oldToNew = new Map([
    [OLD_STRIPE_PRICE_STARTER, { tier: 'starter', newPrice: STRIPE_PRICE_STARTER, oldLabel: '$4.99', newLabel: '$9.99' }],
    [OLD_STRIPE_PRICE_PERSONAL, { tier: 'personal', newPrice: STRIPE_PRICE_PERSONAL, oldLabel: '$9.99', newLabel: '$19.99' }],
    [OLD_STRIPE_PRICE_PRO, { tier: 'pro', newPrice: STRIPE_PRICE_PRO, oldLabel: '$19.99', newLabel: '$39.99' }],
  ]);
  if (OLD_STRIPE_PRICE_ID) {
    // The legacy pre-tier-ladder price — netlify/lib/plans.js's
    // planKeyForPriceId() has always treated it as equivalent to Personal.
    oldToNew.set(OLD_STRIPE_PRICE_ID, { tier: 'personal (legacy $15 price)', newPrice: STRIPE_PRICE_PERSONAL, oldLabel: '$15.00', newLabel: '$19.99' });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const client = new pg.Client({ connectionString: stripSslMode(DATABASE_URL), ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log(EXECUTE ? '*** LIVE RUN — this will modify real subscriptions ***' : 'DRY RUN — no changes will be made (pass --execute to apply)');
  console.log(`Proration behavior: ${PRORATE_NOW ? 'create_prorations (bills the difference now)' : 'none (takes effect at next renewal)'}`);
  console.log('');

  try {
    const { rows } = await client.query(
      `SELECT id, email, stripe_customer_id, stripe_subscription_id
       FROM users
       WHERE stripe_subscription_id IS NOT NULL AND subscription_status = 'active'`,
    );

    console.log(`Found ${rows.length} user(s) with an active subscription.\n`);

    let migrated = 0;
    let skippedAlreadyNew = 0;
    let skippedUnrecognized = 0;
    let failed = 0;

    for (const user of rows) {
      let subscription;
      try {
        subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      } catch (err) {
        console.error(`[ERROR] ${user.email}: could not retrieve subscription ${user.stripe_subscription_id}: ${err.message}`);
        failed++;
        continue;
      }

      const item = subscription.items.data[0];
      const currentPriceId = item?.price?.id;
      const mapping = oldToNew.get(currentPriceId);

      const knownNewPrices = new Set([STRIPE_PRICE_STARTER, STRIPE_PRICE_PERSONAL, STRIPE_PRICE_PRO]);
      if (knownNewPrices.has(currentPriceId)) {
        skippedAlreadyNew++;
        continue; // already migrated (safe to re-run this script)
      }

      if (!mapping) {
        console.warn(`[SKIP] ${user.email}: subscription item is on an unrecognized price (${currentPriceId}) — not touching it.`);
        skippedUnrecognized++;
        continue;
      }

      console.log(
        `[${EXECUTE ? 'MIGRATING' : 'WOULD MIGRATE'}] ${user.email} (${subscription.id}): ${mapping.tier} ${mapping.oldLabel} -> ${mapping.newLabel}`,
      );

      if (EXECUTE) {
        try {
          await stripe.subscriptions.update(subscription.id, {
            items: [{ id: item.id, price: mapping.newPrice }],
            proration_behavior: PRORATE_NOW ? 'create_prorations' : 'none',
          });
          migrated++;
        } catch (err) {
          console.error(`[ERROR] ${user.email}: update failed: ${err.message}`);
          failed++;
        }
      } else {
        migrated++;
      }
    }

    console.log('');
    console.log(
      `${EXECUTE ? 'Migrated' : 'Would migrate'}: ${migrated}. Already on new pricing: ${skippedAlreadyNew}. Unrecognized (skipped): ${skippedUnrecognized}. Failed: ${failed}.`,
    );
    if (!EXECUTE) {
      console.log('This was a dry run — re-run with --execute to actually apply these changes.');
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
