import { getDatabase } from '@netlify/database';
import { requireAdmin } from '../lib/auth.js';

const VALID_ROLES = ['user', 'admin'];
const VALID_SUBSCRIPTION_STATUSES = ['none', 'active', 'past_due', 'canceled'];

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

  const { user_id: userId, role, subscription_status: subscriptionStatus } = body ?? {};
  if (!userId) return jsonResponse(400, { error: 'Missing "user_id".' });
  if (role !== undefined && !VALID_ROLES.includes(role)) {
    return jsonResponse(400, { error: 'Invalid role.' });
  }
  if (subscriptionStatus !== undefined && !VALID_SUBSCRIPTION_STATUSES.includes(subscriptionStatus)) {
    return jsonResponse(400, { error: 'Invalid subscription_status.' });
  }
  if (userId === admin.id && role === 'user') {
    return jsonResponse(400, { error: "You can't remove your own admin access." });
  }

  if (role !== undefined) {
    await db.sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
  }
  if (subscriptionStatus !== undefined) {
    await db.sql`UPDATE users SET subscription_status = ${subscriptionStatus} WHERE id = ${userId}`;
  }

  const [user] = await db.sql`
    SELECT id, email, role, subscription_status, trial_ends_at, created_at
    FROM users WHERE id = ${userId}
  `;
  if (!user) return jsonResponse(404, { error: 'User not found.' });

  return jsonResponse(200, { user });
};
