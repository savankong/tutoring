import { INVITE_REWARD_CREDITS } from './plans.js';

// Landing page slugs are lowercase-kebab-case (see content/landing-pages/),
// so anything else arriving in a ref param/cookie is either stale, spoofed,
// or junk — drop it rather than storing it.
const REF_RE = /^[a-z0-9-]{1,64}$/;

export function sanitizeRef(value) {
  if (typeof value !== 'string') return null;
  return REF_RE.test(value) ? value : null;
}

// User-to-user invite codes (Account page "Invite friends") are just each
// user's own id — users.id is already a random UUID (see the create_users
// migration), so it doubles as an unguessable invite code with no separate
// column/generation step needed. Deliberately kept as a fully separate
// param/cookie from the landing-page ref above (a UUID vs. a kebab-case
// slug) so the two attribution mechanisms — landing page vs. inviting user
// — never get confused for each other.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function inviteCodeForUserId(id) {
  return id;
}

export function userIdFromInviteCode(code) {
  return typeof code === 'string' && UUID_RE.test(code) ? code : null;
}

// Grants the invite-a-friend reward for a just-verified (or, for Google,
// just-created) user, if eligible — called from verify-email.js (email/
// password path) and google-oauth-callback.js's new-user branch (Google
// path, immediately, since Google already verified the email). A single
// guarded UPDATE claims the "not yet granted" state atomically (mirrors
// debitPass's guarded-UPDATE pattern in access.js) before crediting the
// inviter, so a retry or concurrent call can never double-grant it.
export async function grantInviteReward(db, userId) {
  const [row] = await db.sql`
    UPDATE users
    SET invite_reward_granted_at = now()
    WHERE id = ${userId} AND invited_by_user_id IS NOT NULL AND invite_reward_granted_at IS NULL
    RETURNING invited_by_user_id
  `;
  if (!row) return;
  await db.sql`UPDATE users SET credit_balance = credit_balance + ${INVITE_REWARD_CREDITS} WHERE id = ${row.invited_by_user_id}`;
}
