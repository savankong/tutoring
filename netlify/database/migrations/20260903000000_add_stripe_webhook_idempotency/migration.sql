-- Global Stripe webhook idempotency guard. Stripe explicitly documents that
-- a webhook event may be delivered more than once (retries on timeout/5xx/
-- network hiccups) — event.id is the recommended de-dupe key. The existing
-- purchase-processing branches in stripe-webhook.js already guard their own
-- DB writes per-checkout-session (ON CONFLICT on stripe_checkout_session_id
-- in credit_purchases/pass_purchases), but the plan-subscription branch had
-- no such guard at all, and none of the three branches had any way to know
-- "have I already fired the Plausible conversion event for this delivery" —
-- this table answers that for the whole handler in one place, checked once
-- at the top before any branch runs.
CREATE TABLE stripe_webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
