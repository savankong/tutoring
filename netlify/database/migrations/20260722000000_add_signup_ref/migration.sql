-- Tracks which landing page (if any) drove a signup, for later attribution
-- (ambassador/referral program). Set once at signup from the ?ref=<slug>
-- query param on the CTA link and never overwritten afterward.
ALTER TABLE users ADD COLUMN signup_ref TEXT;
