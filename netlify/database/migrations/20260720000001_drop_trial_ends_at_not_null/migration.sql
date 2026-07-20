-- Free tier replaces the time-limited trial, so new signups no longer set
-- trial_ends_at. Existing rows keep their value; it's just unused now.
ALTER TABLE users ALTER COLUMN trial_ends_at DROP NOT NULL;
