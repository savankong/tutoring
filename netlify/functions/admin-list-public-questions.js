import { getDatabase } from '../lib/db.js';
import { requireAdmin } from '../lib/auth.js';

const PAGE_SIZE = 200;

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

  const url = new URL(request.url);
  const topicSlug = url.searchParams.get('topic_slug');

  const questions = topicSlug
    ? await db.sql`
        SELECT id, topic_slug, question, answer, times_seen, published, first_seen_at, last_seen_at
        FROM public_questions
        WHERE topic_slug = ${topicSlug}
        ORDER BY last_seen_at DESC
        LIMIT ${PAGE_SIZE}
      `
    : await db.sql`
        SELECT id, topic_slug, question, answer, times_seen, published, first_seen_at, last_seen_at
        FROM public_questions
        ORDER BY last_seen_at DESC
        LIMIT ${PAGE_SIZE}
      `;

  return jsonResponse(200, { questions });
};
