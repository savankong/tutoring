-- Password-reset flow: a hash of the one-time reset token (never the raw
-- token itself, mirroring password_hash) plus its expiry. Cleared on
-- successful reset or overwritten by the next forgot-password request.
ALTER TABLE users ADD COLUMN reset_token_hash TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires_at TIMESTAMPTZ;
