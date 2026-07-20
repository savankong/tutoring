-- Add-on credit packs replace automatic per-capture overage billing for
-- paid tiers. credit_balance is the user's current stash of purchased
-- credits (1 credit = 1 capture beyond cap + grace buffer); it rolls over
-- indefinitely while the user stays on a paid plan and is reset to 0 if
-- they drop back to Free (see stripe-webhook.js).
ALTER TABLE users ADD COLUMN credit_balance INTEGER NOT NULL DEFAULT 0;

-- Ledger of credit-pack purchases, keyed on the Stripe checkout session id
-- so the webhook can apply each purchase exactly once even if Stripe
-- retries the event.
CREATE TABLE credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  stripe_checkout_session_id TEXT UNIQUE NOT NULL,
  credits INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
