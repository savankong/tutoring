import { getDatabase } from '@netlify/database';
import { requireAdmin } from '../lib/auth.js';
import { PLANS } from '../lib/plans.js';

const VALID_ROLES = ['user', 'admin'];
const VALID_SUBSCRIPTION_STATUSES = ['none', 'active', 'past_due', 'canceled'];
const VALID_PLANS = Object.keys(PLANS);

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const db = getDatabase();
  const admin = await requireAdmin(request, db);
  if (!admin) return jsonResponse(403, { error: 'Admin access required.' });

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const {
    user_id: userId,
    role,
    subscription_status: subscriptionStatus,
    plan,
    add_credits: addCredits,
  } = body ?? {};
  if (!userId) return jsonResponse(400, { error: 'Missing "user_id".' });
  if (role !== undefined && !VALID_ROLES.includes(role)) {
    return jsonResponse(400, { error: 'Invalid role.' });
  }
  if (subscriptionStatus !== undefined && !VALID_SUBSCRIPTION_STATUSES.includes(subscriptionStatus)) {
    return jsonResponse(400, { error: 'Invalid subscription_status.' });
  }
  if (plan !== undefined && !VALID_PLANS.includes(plan)) {
    return jsonResponse(400, { error: 'Invalid plan.' });
  }
  if (addCredits !== undefined && (!Number.isInteger(addCredits) || addCredits === 0)) {
    return jsonResponse(400, { error: '"add_credits" must be a non-zero integer.' });
  }
  if (userId === admin.id && role === 'user') {
    return jsonResponse(400, { error: "You can't remove your own admin access." });
  }

  if (role !== undefined) {
    await db.sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
  }
  if (subscriptionStatus !== undefined) {
    // Keep `plan` in sync with an admin comp: active -> Personal tier caps,
    // none/canceled -> back to Free. past_due is left alone (a Stripe-driven
    // grace state, not something an admin sets directly).
    const inferredPlan =
      subscriptionStatus === 'active' ? 'personal' : subscriptionStatus === 'past_due' ? undefined : 'free';
    if (inferredPlan !== undefined) {
      await db.sql`UPDATE users SET subscription_status = ${subscriptionStatus}, plan = ${inferredPlan} WHERE id = ${userId}`;
    } else {
      await db.sql`UPDATE users SET subscription_status = ${subscriptionStatus} WHERE id = ${userId}`;
    }
  }
  if (plan !== undefined) {
    // Setting a specific plan directly (comping someone onto Starter/
    // Personal/Pro, or granting the admin-only Unlimited tier) mirrors it
    // into subscription_status so the rest of the app treats them as an
    // active paid user without touching Stripe.
    const status = plan === 'free' ? 'none' : 'active';
    await db.sql`UPDATE users SET plan = ${plan}, subscription_status = ${status} WHERE id = ${userId}`;
  }
  if (addCredits !== undefined) {
    // GREATEST(0, ...) so a large deduction can't drive the balance negative.
    await db.sql`UPDATE users SET credit_balance = GREATEST(0, credit_balance + ${addCredits}) WHERE id = ${userId}`;
  }

  const [user] = await db.sql`
    SELECT id, email, role, subscription_status, plan, credit_balance, created_at
    FROM users WHERE id = ${userId}
  `;
  if (!user) return jsonResponse(404, { error: 'User not found.' });

  return jsonResponse(200, { user });
};
