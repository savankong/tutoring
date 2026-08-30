import { OVERAGE_UNIT_CENTS, planFor } from './plans.js';

export { OVERAGE_UNIT_CENTS };

/** True once a user cannot make another capture: Free tier hits a hard
 * block at its cap; paid tiers hit a hard block once past cap + grace
 * buffer with no purchased credits left to draw down. */
export function isCapped(user, capturesUsed) {
  const plan = planFor(user);
  if (!plan.creditsAllowed) return capturesUsed >= plan.captureCap;
  return capturesUsed >= plan.captureCap + plan.graceBuffer && (user?.credit_balance ?? 0) <= 0;
}

/** True once a paid subscriber has used their plan's cap plus its grace
 * buffer — this is when the usage indicator should appear and when captures
 * start drawing down the purchased credit balance. */
export function isDrawingOnCredits(user, capturesUsed) {
  const plan = planFor(user);
  return plan.creditsAllowed && capturesUsed >= plan.captureCap + plan.graceBuffer;
}

export async function capturesUsedThisPeriod(db, userId, periodStart) {
  const [row] = await db.sql`
    SELECT count(*)::int AS count
    FROM captures
    WHERE user_id = ${userId}
      AND created_at >= COALESCE(${periodStart}, date_trunc('month', now()))
      AND pass_purchase_id IS NULL
  `;
  return row.count;
}

/** The soonest-expiring active (non-expired, not-yet-fully-used) one-time
 * pass for this user, or null. Picking the soonest-expiring one first means
 * a user with multiple passes never lets an about-to-expire one go to waste
 * while a longer-lived one still has room. */
export async function findActivePass(db, userId) {
  const [row] = await db.sql`
    SELECT id, pass_type, captures_cap, captures_used, expires_at
    FROM pass_purchases
    WHERE user_id = ${userId}
      AND expires_at > now()
      AND captures_used < captures_cap
    ORDER BY expires_at ASC
    LIMIT 1
  `;
  return row ?? null;
}

/** Best-effort pass debit — mirrors debitCredit's guarded-UPDATE pattern
 * (never blocks a capture that's already been allowed through, and the
 * `captures_used < captures_cap` guard keeps concurrent requests from
 * driving it over cap). */
export async function debitPass(db, passId) {
  try {
    await db.sql`
      UPDATE pass_purchases SET captures_used = captures_used + 1
      WHERE id = ${passId} AND captures_used < captures_cap
    `;
  } catch (err) {
    console.error('debitPass failed:', err);
  }
}
