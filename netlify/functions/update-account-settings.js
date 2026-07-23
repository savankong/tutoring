import { getDatabase } from '@netlify/database';
import { requireUser } from '../lib/auth.js';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Self-service settings a user can change about their own account —
// currently just the public question bank opt-out (see
// netlify/functions/analyze-question.js -> publishPublicQuestion).
export default async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const db = getDatabase();
  const user = await requireUser(request, db);
  if (!user) return jsonResponse(401, { error: 'Not signed in.' });

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const { public_captures_opt_out: optOut } = body ?? {};
  if (typeof optOut !== 'boolean') {
    return jsonResponse(400, { error: '"public_captures_opt_out" must be a boolean.' });
  }

  await db.sql`UPDATE users SET public_captures_opt_out = ${optOut} WHERE id = ${user.id}`;

  return jsonResponse(200, { public_captures_opt_out: optOut });
};
