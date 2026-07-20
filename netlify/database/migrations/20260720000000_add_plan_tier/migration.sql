ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';

-- Existing active subscribers were all on the single legacy $15/month plan,
-- which has the same caps as the new Personal tier — backfill them so
-- nothing changes for anyone already paying.
UPDATE users SET plan = 'personal' WHERE subscription_status = 'active';
