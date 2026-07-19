export const CAPTURE_CAP = 200;

// Invisible cushion beyond CAPTURE_CAP before overage billing kicks in —
// no warning, no UI change, purely so nobody gets blocked mid-session.
export const GRACE_BUFFER = 20;

// Price per capture once a user is past CAPTURE_CAP + GRACE_BUFFER, billed
// as a Stripe invoice item (see analyze-question.js).
export const OVERAGE_UNIT_CENTS = 12;

/** Trial access is governed by trial_ends_at; once a real subscription
 * exists, Stripe webhooks own subscription_status instead. */
export function hasAccess(user) {
  if (user.subscription_status === 'active') return true;
  if (user.subscription_status === 'none') {
    return new Date(user.trial_ends_at).getTime() > Date.now();
  }
  return false;
}

/** True once an active subscriber has used more than the plan cap plus the
 * grace buffer — this is when the usage indicator should appear and when
 * overage billing has started. */
export function isInOverage(user, capturesUsed) {
  return user.subscription_status === 'active' && capturesUsed > CAPTURE_CAP + GRACE_BUFFER;
}

export async function capturesUsedThisPeriod(db, userId, periodStart) {
  const [row] = await db.sql`
    SELECT count(*)::int AS count
    FROM captures
    WHERE user_id = ${userId}
      AND created_at >= COALESCE(${periodStart}, date_trunc('month', now()))
  `;
  return row.count;
}
