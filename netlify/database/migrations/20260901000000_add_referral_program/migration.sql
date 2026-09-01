-- Invite-a-friend referral program. A user's own id (already a UUID) doubles
-- as their invite code — see netlify/lib/referral.js — so there's no
-- separate code column to generate/keep unique.
--
-- invited_by_user_id: which user's invite link this account signed up
-- through, if any. Set once at signup, never changes.
--
-- invite_reward_granted_at: guards against granting the inviter's reward
-- more than once for the same invited user. Set on the INVITED user's row
-- (not the inviter's) since one inviter can have many invitees, each
-- granting the reward exactly once. The reward itself (+15 to the
-- inviter's credit_balance) fires when this user's email is verified —
-- immediately for Google signups, since Google already verified it — see
-- netlify/functions/verify-email.js and google-oauth-callback.js.
ALTER TABLE users ADD COLUMN invited_by_user_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN invite_reward_granted_at TIMESTAMPTZ;

-- Whether this user has been shown the one-time "Invite your friends"
-- popup yet (see src/components/InviteFriendsModal.jsx) — tracked
-- server-side, not in localStorage, so it stays dismissed across devices.
ALTER TABLE users ADD COLUMN invite_modal_seen_at TIMESTAMPTZ;

-- Used to count/list a user's invited friends on the Account page.
CREATE INDEX users_invited_by_user_id_idx ON users (invited_by_user_id);
