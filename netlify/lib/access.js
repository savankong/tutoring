import { OVERAGE_UNIT_CENTS, planFor } from './plans.js';

export { OVERAGE_UNIT_CENTS };

/** True once a user has hit their plan's cap with no overage billing to
 * fall back on (Free tier only — every paid tier bills overage instead of
 * blocking). */
export function isCapped(user, capturesUsed) {
  const plan = planFor(user);
  return !plan.overageAllowed && capturesUsed >= plan.captureCap;
}

/** True once a paid subscriber has used more than their plan's cap plus its
 * grace buffer — this is when the usage indicator should appear and when
 * overage billing has started. */
export function isInOverage(user, capturesUsed) {
  const plan = planFor(user);
  return plan.overageAllowed && capturesUsed > plan.captureCap + plan.graceBuffer;
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
