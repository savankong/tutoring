// Pulls auto-published, real captured questions (see
// netlify/functions/analyze-question.js -> publishPublicQuestion) into the
// static landing-page build. Only works when DATABASE_URL is set in the
// build environment — builds without it fall back to the static JSON
// content alone.
export async function fetchPublicQuestionsBySlug() {
  try {
    const { getDatabase } = await import('../netlify/lib/db.js');
    const db = getDatabase();
    const rows = await db.sql`
      SELECT topic_slug, question, answer, times_seen
      FROM public_questions
      WHERE published = true
      ORDER BY times_seen DESC
    `;
    const bySlug = {};
    for (const row of rows) {
      (bySlug[row.topic_slug] ??= []).push(row);
    }
    return bySlug;
  } catch (err) {
    console.warn('fetchPublicQuestionsBySlug: no database available, using static content only.', err.message);
    return {};
  }
}
