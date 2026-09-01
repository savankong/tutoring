import { getDatabase } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';

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
  const user = await requireUser(request, db);
  if (!user) return jsonResponse(401, { error: 'Not signed in.' });

  await db.sql`
    UPDATE users SET invite_modal_seen_at = now()
    WHERE id = ${user.id} AND invite_modal_seen_at IS NULL
  `;

  return jsonResponse(200, { ok: true });
};
