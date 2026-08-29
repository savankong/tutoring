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

  const {
    id,
    title,
    question_text: questionText,
    answer,
    explanation,
    why_others_wrong: whyOthersWrong,
  } = body ?? {};

  if (!id) return jsonResponse(400, { error: 'Missing "id".' });
  if (typeof answer !== 'string' || !answer.trim()) {
    return jsonResponse(400, { error: '"answer" is required.' });
  }

  const [capture] = await db.sql`
    UPDATE captures SET
      title = ${title ?? ''},
      question_text = ${questionText ?? ''},
      answer = ${answer},
      explanation = ${explanation ?? ''},
      why_others_wrong = ${whyOthersWrong ?? ''}
    WHERE id = ${id}
    RETURNING id, user_id, title, question_text, answer, explanation, why_others_wrong, created_at
  `;
  if (!capture) return jsonResponse(404, { error: 'Submission not found.' });

  const [user] = await db.sql`SELECT email FROM users WHERE id = ${capture.user_id}`;

  return jsonResponse(200, { capture: { ...capture, user_email: user?.email } });
};
