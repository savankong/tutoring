import { getDatabase } from '@netlify/database';
import { requireAdmin } from '../lib/auth.js';

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

  const { user_id: userId } = body ?? {};
  if (!userId) return jsonResponse(400, { error: 'Missing "user_id".' });
  if (userId === admin.id) {
    return jsonResponse(400, { error: "You can't delete your own account." });
  }

  await db.sql`DELETE FROM users WHERE id = ${userId}`;
  return jsonResponse(200, { deleted: true });
};
