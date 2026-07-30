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

  const {
    user_email: userEmail,
    title,
    question_text: questionText,
    answer,
    explanation,
    why_others_wrong: whyOthersWrong,
  } = body ?? {};

  if (typeof userEmail !== 'string' || !userEmail.trim()) {
    return jsonResponse(400, { error: '"user_email" is required.' });
  }
  if (typeof answer !== 'string' || !answer.trim()) {
    return jsonResponse(400, { error: '"answer" is required.' });
  }

  const [user] = await db.sql`SELECT id, email FROM users WHERE email = ${userEmail.trim()}`;
  if (!user) return jsonResponse(404, { error: `No user found with email "${userEmail}".` });

  const [capture] = await db.sql`
    INSERT INTO captures (user_id, title, question_text, answer, explanation, why_others_wrong)
    VALUES (${user.id}, ${title ?? ''}, ${questionText ?? ''}, ${answer}, ${explanation ?? ''}, ${whyOthersWrong ?? ''})
    RETURNING id, user_id, title, question_text, answer, explanation, why_others_wrong, created_at
  `;

  return jsonResponse(200, { capture: { ...capture, user_email: user.email } });
};
