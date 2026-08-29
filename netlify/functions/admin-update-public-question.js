import { getDatabase } from '../lib/db.js';
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

  const { id, published } = body ?? {};
  if (!id) return jsonResponse(400, { error: 'Missing "id".' });
  if (typeof published !== 'boolean') {
    return jsonResponse(400, { error: '"published" must be a boolean.' });
  }

  const [question] = await db.sql`
    UPDATE public_questions SET published = ${published} WHERE id = ${id}
    RETURNING id, topic_slug, question, answer, times_seen, published
  `;
  if (!question) return jsonResponse(404, { error: 'Question not found.' });

  return jsonResponse(200, { question });
};
