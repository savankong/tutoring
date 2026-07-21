import { getDatabase } from '@netlify/database';
import { requireAdmin } from '../lib/auth.js';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default async (request) => {
  const db = getDatabase();
  const admin = await requireAdmin(request, db);
  if (!admin) return jsonResponse(403, { error: 'Admin access required.' });

  const users = await db.sql`
    SELECT id, email, role, subscription_status, plan, credit_balance, created_at
    FROM users
    ORDER BY created_at DESC
  `;

  return jsonResponse(200, { users });
};
