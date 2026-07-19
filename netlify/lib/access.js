export const CAPTURE_CAP = 200;

/** Trial access is governed by trial_ends_at; once a real subscription
 * exists, Stripe webhooks own subscription_status instead. */
export function hasAccess(user) {
  if (user.subscription_status === 'active') return true;
  if (user.subscription_status === 'none') {
    return new Date(user.trial_ends_at).getTime() > Date.now();
  }
  return false;
}

export async function capturesUsedThisPeriod(db, userId) {
  const [row] = await db.sql`
    SELECT count(*)::int AS count
    FROM captures
    WHERE user_id = ${userId}
      AND created_at >= date_trunc('month', now())
  `;
  return row.count;
}
