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
  `;
  return row.count;
}
