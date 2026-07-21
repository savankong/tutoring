import { getDatabase } from '@netlify/database';
import { requireUser } from '../lib/auth.js';
import { capturesUsedThisPeriod, isDrawingOnCredits } from '../lib/access.js';
import { planFor } from '../lib/plans.js';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default async (request) => {
  const db = getDatabase();
  const user = await requireUser(request, db);
  if (!user) return jsonResponse(401, { error: 'Not signed in.' });

  const capturesUsed = await capturesUsedThisPeriod(db, user.id, user.current_period_start);
  const plan = planFor(user);

  let lastCreditPurchase = null;
  if (plan.creditsAllowed) {
    const [row] = await db.sql`
      SELECT created_at FROM credit_purchases
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    lastCreditPurchase = row?.created_at ?? null;
  }

  return jsonResponse(200, {
    id: user.id,
    email: user.email,
    role: user.role,
    plan: plan.key,
    plan_name: plan.name,
    subscription_status: user.subscription_status,
    current_period_start: user.current_period_start,
    captures_used: capturesUsed,
    captures_cap: plan.captureCap,
    grace_buffer: plan.graceBuffer,
    credits_allowed: plan.creditsAllowed,
    credit_balance: user.credit_balance ?? 0,
    using_credits: isDrawingOnCredits(user, capturesUsed),
    last_credit_purchase: lastCreditPurchase,
  });
};
