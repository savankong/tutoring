import { getDatabase } from '../lib/db.js';
import { requireAdmin } from '../lib/auth.js';

const PAGE_SIZE = 500;

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

  // Excludes junk rows predating the write-time guard in analyze-question.js
  // (blank question_text/answer, or the literal "No question detected."
  // placeholder) — misfires, not real submissions.
  const captures = await db.sql`
    SELECT c.id, c.user_id, u.email AS user_email, c.title, c.question_text, c.answer,
           c.explanation, c.why_others_wrong, c.created_at
    FROM captures c
    JOIN users u ON u.id = c.user_id
    WHERE btrim(coalesce(c.question_text, '')) <> ''
      AND btrim(coalesce(c.answer, '')) <> ''
      AND c.answer <> 'No question detected.'
    ORDER BY c.created_at DESC
    LIMIT ${PAGE_SIZE}
  `;

  return jsonResponse(200, { captures });
};
