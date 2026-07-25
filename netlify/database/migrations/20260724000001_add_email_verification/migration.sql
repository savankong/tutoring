-- Email verification gate for the free-tier abuse case: email/password
-- accounts must click a verification link before captures work (see
-- analyze-question.js). Google accounts are exempt (Google already
-- verified them) via the google_id check, not this column.
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN verify_token_hash TEXT;
ALTER TABLE users ADD COLUMN verify_token_expires_at TIMESTAMPTZ;

-- Grandfather every account that existed before this feature shipped —
-- without this, all current users (including paying subscribers) would
-- suddenly be locked out of captures on their next request.
UPDATE users SET email_verified = true;
