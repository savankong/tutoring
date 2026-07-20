import { getDatabase } from '@netlify/database';
import { requireUser } from '../lib/auth.js';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const PAGE_SIZE = 50;

export default async (request) => {
  const db = getDatabase();
  const user = await requireUser(request, db);
  if (!user) return jsonResponse(401, { error: 'Not signed in.' });

  const url = new URL(request.url);
  const before = url.searchParams.get('before'); // ISO timestamp cursor, optional

  const captures = before
    ? await db.sql`
        SELECT id, title, answer, explanation, created_at FROM captures
        WHERE user_id = ${user.id} AND created_at < ${before}
        ORDER BY created_at DESC
        LIMIT ${PAGE_SIZE}
      `
    : await db.sql`
        SELECT id, title, answer, explanation, created_at FROM captures
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT ${PAGE_SIZE}
      `;

  return jsonResponse(200, { captures });
};
