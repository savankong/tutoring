-- One-time, non-recurring capture passes (24-hour/7-day/30-day) — a
-- separate capacity pool from the monthly plan cap: time-limited by a real
-- expiration timestamp instead of a billing period, purchased via a
-- one-time Stripe payment (mode: "payment", not "subscription"). Consumed
-- before plan cap/grace/credits on each capture (see netlify/lib/access.js)
-- since an unused pass capture just expires and is wasted, unlike plan cap
-- (regenerates every period) or credits (roll over indefinitely on a paid
-- plan). expires_at is set at webhook time (purchase confirmation), not at
-- checkout-session creation, so the clock starts on actual payment.
CREATE TABLE pass_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL CHECK (pass_type IN ('cram_24h', 'prep_7d', 'unlimited_30d')),
  captures_cap INTEGER NOT NULL,
  captures_used INTEGER NOT NULL DEFAULT 0,
  amount_cents INTEGER NOT NULL,
  stripe_checkout_session_id TEXT UNIQUE NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Used by findActivePass() in netlify/lib/access.js to pick the
-- soonest-expiring pass with remaining capacity.
CREATE INDEX pass_purchases_user_active_idx ON pass_purchases (user_id, expires_at);

-- Which pass (if any) funded a given capture. Excluded from the monthly
-- plan-cap count in capturesUsedThisPeriod() so pass usage never eats into
-- a user's regular plan allowance.
ALTER TABLE captures ADD COLUMN pass_purchase_id UUID REFERENCES pass_purchases(id);
