// Pulls auto-published, real captured questions (see
// netlify/functions/analyze-question.js -> publishPublicQuestion) into the
// static landing-page build. Only works when a database connection is
// available, which per CLAUDE.md is only true on `--prod` Netlify deploys —
// local/draft builds fall back to the static JSON content alone.
export async function fetchPublicQuestionsBySlug() {
  try {
    const { getDatabase } = await import('@netlify/database');
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
